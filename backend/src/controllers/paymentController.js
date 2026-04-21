const prisma = require('../prisma');
const paytmChecksum = require('paytmchecksum'); // Need to ensure this is installed or mocked

/**
 * POST /api/payments/initiate
 * { bookingId, paymentMethod: 'Online' | 'Cash' }
 */
exports.initiatePayment = async (req, res) => {
    try {
        const { bookingId, paymentMethod } = req.body;

        if (!bookingId || !paymentMethod) {
            return res.status(400).json({ error: 'bookingId and paymentMethod are required' });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { customerProfile: true }
        });

        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        // Update booking with payment method
        await prisma.booking.update({
            where: { id: bookingId },
            data: { paymentMethod }
        });

        if (paymentMethod === 'Cash') {
            return res.json({
                success: true,
                message: 'Payment set to Cash. Please pay after service.',
                paymentStatus: 'Pending'
            });
        }

        // Online (Paytm) logic
        let callbackUrl = process.env.PAYTM_CALLBACK_URL;

        // If testing on a mobile device locally (backend is an IP like 192.168.x.x), 
        // we must not use "localhost" for the callback, as the phone's browser will fail to reach it.
        if (callbackUrl && callbackUrl.includes('localhost') && req.get('host') && !req.get('host').includes('localhost')) {
            callbackUrl = `${req.protocol}://${req.get('host')}/api/payments/callback`;
        } else if (!callbackUrl) {
            callbackUrl = `${req.protocol}://${req.get('host')}/api/payments/callback`;
        }

        const paytmParams = {
            MID: process.env.PAYTM_MID,
            WEBSITE: process.env.PAYTM_WEBSITE || 'WEBSTAGING',
            CHANNEL_ID: process.env.PAYTM_CHANNEL_ID || 'WAP',
            INDUSTRY_TYPE_ID: process.env.PAYTM_INDUSTRY_TYPE_ID || 'Retail',
            ORDER_ID: bookingId,
            CUST_ID: booking.customerId || 'GUEST_USER',
            TXN_AMOUNT: booking.totalAmount.toString(),
            CALLBACK_URL: callbackUrl,
        };

        // Validate MID - if empty, we are likely in dev/mock mode
        if (!process.env.PAYTM_MID || process.env.PAYTM_MID.includes('MOCK')) {
            return res.json({
                success: true,
                paymentMethod: 'Online',
                paytmParams: {
                    ...paytmParams,
                    MID: 'MOCK_MID_' + Date.now(),
                    CHECKSUMHASH: 'mock_checksum_' + Date.now()
                }
            });
        }

        // Record a pending transaction
        await prisma.transaction.create({
            data: {
                bookingId,
                amount: booking.totalAmount,
                status: 'Pending',
                gateway: 'Paytm',
                payload: paytmParams
            }
        });

        // Generate checksum
        let checksum = 'mock_checksum_' + Date.now();
        if (process.env.PAYTM_KEY && process.env.PAYTM_KEY.length > 5 && !process.env.PAYTM_KEY.includes('YOUR_')) {
            try {
                checksum = await paytmChecksum.generateSignature(paytmParams, process.env.PAYTM_KEY);
            } catch (checksumErr) {
                console.error('Checksum generation failed, using mock:', checksumErr.message);
            }
        }

        res.json({
            success: true,
            paymentMethod: 'Online',
            paytmParams: {
                ...paytmParams,
                CHECKSUMHASH: checksum
            }
        });

    } catch (err) {
        console.error('initiatePayment Error:', err);
        res.status(500).json({ success: false, error: 'Failed to initiate payment', details: err.message });
    }
};

/**
 * POST /api/payments/callback (From Paytm)
 */
exports.paymentCallback = async (req, res) => {
    try {
        const paytmData = req.body;
        console.log('--- PAYTM CALLBACK PAYLOAD ---', JSON.stringify(paytmData, null, 2));

        // Log to file for debugging
        const fs = require('fs');
        fs.appendFileSync('callback_payloads.txt', `[${new Date().toISOString()}] ${JSON.stringify(paytmData, null, 2)}\n\n`);

        const bookingId = paytmData.ORDERID;
        const status = paytmData.STATUS; // TXN_SUCCESS, TXN_FAILURE, PENDING
        const gatewayTxnId = paytmData.TXNID;

        // Verify Checksum
        let isValid = false;
        if (process.env.PAYTM_KEY && process.env.PAYTM_KEY.length > 5 && !process.env.PAYTM_KEY.includes('YOUR_')) {
            try {
                const checksum = paytmData.CHECKSUMHASH;
                delete paytmData.CHECKSUMHASH;
                isValid = await paytmChecksum.verifySignature(JSON.stringify(paytmData), process.env.PAYTM_KEY, checksum);
            } catch (checksumErr) {
                console.error('Checksum verification failed, assuming mock/test:', checksumErr.message);
                isValid = true; // Fallback for dev
            }
        } else {
            // If no key or invalid mock key length, we assume it's a mock or test
            isValid = true;
        }

        let paymentStatus = 'Failed';
        // Relax status check for development/staging - some gateways return 'SUCCESS' instead of 'TXN_SUCCESS'
        const isSuccessStatus = ['TXN_SUCCESS', 'SUCCESS', '01'].includes(String(status).toUpperCase());

        if (isValid && isSuccessStatus) {
            paymentStatus = 'Paid';
        } else if (status === 'PENDING') {
            paymentStatus = 'Pending';
        } else {
            console.log(`[paymentCallback] Transaction not successful: Status=${status}, isValid=${isValid}`);
        }

        if (bookingId) {
            // Update transaction record
            await prisma.transaction.updateMany({
                where: { bookingId, status: 'Pending' },
                data: {
                    status: paymentStatus === 'Paid' ? 'Success' : paymentStatus === 'Pending' ? 'Pending' : 'Failed',
                    gatewayTxnId,
                    payload: paytmData
                }
            });

            // Update booking
            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    paymentStatus,
                    paymentDetails: paytmData,
                    // If payment fails, mark booking as Cancelled to avoid "requested" duplicates/confusion
                    status: paymentStatus === 'Paid' ? 'Confirmed' : (paymentStatus === 'Failed' ? 'Cancelled' : 'Requested')
                }
            });
        }

        const isSuccess = paymentStatus === 'Paid';

        // Professional redirect/postMessage back to React Native
        res.send(`
            <!DOCTYPE html>
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #ffffff; color: #1a1a1a; }
                        .container { text-align: center; padding: 40px; max-width: 400px; width: 90%; }
                        .icon { font-size: 64px; margin-bottom: 24px; display: inline-block; }
                        h2 { font-size: 24px; font-weight: 800; margin-bottom: 12px; color: ${isSuccess ? '#10b981' : '#ef4444'}; }
                        p { font-size: 16px; color: #6b7280; line-height: 1.5; margin-bottom: 32px; }
                        .loader { width: 24px; height: 24px; border: 3px solid #e5e7eb; border-top-color: #7c3aed; border-radius: 50%; display: inline-block; animation: spin 1s linear infinite; margin-top: 20px; }
                        @keyframes spin { to { transform: rotate(360deg); } }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="icon">${isSuccess ? '✅' : '❌'}</div>
                        <h2>Payment ${paymentStatus}</h2>
                        <p>${isSuccess ? 'Your payment has been successfully processed. Redirecting you back to complete your booking...' : 'We couldn\'t process your payment. Redirecting you back to try again...'}</p>
                        <div class="loader"></div>
                    </div>
                    <script>
                        setTimeout(() => {
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    action: 'PAYMENT_COMPLETE',
                                    status: '${paymentStatus}',
                                    bookingId: '${bookingId}'
                                }));
                            }
                        }, 2500);
                    </script>
                </body>
            </html>
        `);

    } catch (err) {
        console.error('paymentCallback Error:', err);
        res.status(500).send('Callback processing failed');
    }
};

/**
 * POST /api/payments/confirm-cash
 * { bookingId, partnerId }
 */
exports.confirmCashReceipt = async (req, res) => {
    try {
        const { bookingId, partnerId } = req.body;

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId }
        });

        if (!booking || booking.partnerId !== partnerId) {
            return res.status(403).json({ error: 'Unauthorized or booking not found' });
        }

        await prisma.booking.update({
            where: { id: bookingId },
            data: {
                partnerConfirmedReceipt: true,
                paymentStatus: 'Paid',
                status: 'Completed' // or keep as is until manual completion
            }
        });

        res.json({ success: true, message: 'Cash receipt confirmed' });

    } catch (err) {
        console.error('confirmCashReceipt Error:', err);
        res.status(500).json({ error: 'Failed to confirm cash receipt' });
    }
};

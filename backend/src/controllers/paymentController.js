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
            include: { customer: true }
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
        const paytmParams = {
            MID: process.env.PAYTM_MID,
            WEBSITE: process.env.PAYTM_WEBSITE,
            CHANNEL_ID: process.env.PAYTM_CHANNEL_ID,
            INDUSTRY_TYPE_ID: 'Retail',
            ORDER_ID: bookingId,
            CUST_ID: booking.customerId || 'GUEST',
            TXN_AMOUNT: booking.totalAmount.toString(),
            CALLBACK_URL: process.env.PAYTM_CALLBACK_URL,
        };

        // For V0, we might mock the checksum if paytmchecksum is not available
        let checksum = "";
        try {
            checksum = await paytmChecksum.generateSignature(JSON.stringify(paytmParams), process.env.PAYTM_KEY);
        } catch (e) {
            console.error("Paytm Checksum Error:", e);
            checksum = "mock_checksum_" + Date.now();
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
        res.status(500).json({ error: 'Failed to initiate payment' });
    }
};

/**
 * POST /api/payments/callback (From Paytm)
 */
exports.paymentCallback = async (req, res) => {
    try {
        const paytmData = req.body;
        const bookingId = paytmData.ORDERID;
        const status = paytmData.STATUS; // TXN_SUCCESS, TXN_FAILURE

        let paymentStatus = 'Failed';
        if (status === 'TXN_SUCCESS') {
            paymentStatus = 'Paid';
        }

        await prisma.booking.update({
            where: { id: bookingId },
            data: {
                paymentStatus,
                paymentDetails: paytmData,
                status: paymentStatus === 'Paid' ? 'Confirmed' : 'Requested'
            }
        });

        // Redirect or send response
        res.send(`Payment ${paymentStatus}. You can close this window now.`);

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

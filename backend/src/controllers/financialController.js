const prisma = require('../prisma');
const paytmChecksum = require('paytmchecksum');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

async function calculateBalance(partnerId, startDate, endDate) {
    // 1. Calculate Earnings from Completed Bookings
    const earningsFilter = {
        partnerId,
        status: 'Completed'
    };

    const isValidDate = (d) => d && d !== 'undefined' && d !== 'null' && !isNaN(new Date(d).getTime());

    if (isValidDate(startDate) && isValidDate(endDate)) {
        earningsFilter.bookingDate = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }

    const bookings = await prisma.booking.findMany({
        where: earningsFilter,
        select: {
            partnerEarnings: true,
            platformFee: true,
            totalAmount: true,
            paymentMethod: true,
            status: true
        }
    });

    console.log(`Backend [calculateBalance]: Found ${bookings.length} bookings for partner ${partnerId}. Filter: ${JSON.stringify(earningsFilter)}`);

    const totalEarnings = bookings.reduce((sum, b) => sum + (Number(b.partnerEarnings) || 0), 0);
    const totalPlatformFees = bookings.reduce((sum, b) => sum + (Number(b.platformFee) || 0), 0);
    
    const totalOnlineEarnings = bookings
        .filter(b => b.paymentMethod && b.paymentMethod.toLowerCase() === 'online')
        .reduce((sum, b) => sum + (Number(b.partnerEarnings) || 0), 0);
    
    const totalCashEarnings = bookings
        .filter(b => !b.paymentMethod || b.paymentMethod.toLowerCase() === 'cash')
        .reduce((sum, b) => sum + (Number(b.partnerEarnings) || 0), 0);

    // 2. Global Wallet Status (ALWAYS UNFILTERED)
    const settlements = await prisma.settlementRequest.findMany({
        where: { partnerId, status: 'Paid' },
        select: { amount: true }
    });
    const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);

    const processingSettlements = await prisma.settlementRequest.findMany({
        where: { partnerId, status: { in: ['Processing', 'Pending'] } },
        select: { amount: true }
    });
    const pendingAmount = processingSettlements.reduce((sum, s) => sum + s.amount, 0);

    // Available balance MUST be calculated from lifetime online earnings minus lifetime settlements
    const lifetimeOnlineRes = await prisma.booking.aggregate({
        where: { partnerId, status: 'Completed', paymentMethod: 'Online' },
        _sum: { partnerEarnings: true }
    });
    const lifetimeOnlineEarnings = lifetimeOnlineRes._sum.partnerEarnings || 0;

    const availableBalance = lifetimeOnlineEarnings - totalSettled - pendingAmount;

    return {
        totalEarnings,
        totalOnlineEarnings,
        totalCashEarnings,
        totalPlatformFees,
        totalSettled,
        pendingAmount,
        availableBalance: Math.max(0, availableBalance)
    };
}

/**
 * GET /api/partners/:id/earnings
 */
exports.getEarningsSummary = async (req, res) => {
    try {
        let { id } = req.params;
        const { startDate, endDate } = req.query;

        console.log(`Backend: Fetching earnings for ID: ${id}, period: ${startDate} to ${endDate}`);

        // 1. Resolve partnerId if id is actually a userId
        const partner = await prisma.partnerProfile.findFirst({
            where: {
                OR: [
                    { id: id },
                    { userId: id }
                ]
            },
            select: { id: true }
        });

        if (!partner) {
            console.warn(`Backend: No partner found for ID: ${id}`);
            return res.status(404).json({ error: 'Partner not found' });
        }

        const resolvedPartnerId = partner.id;
        const balanceData = await calculateBalance(resolvedPartnerId, startDate, endDate);
        
        res.json({
            success: true,
            data: balanceData
        });
    } catch (err) {
        console.error('getEarningsSummary Error:', err);
        res.status(500).json({ error: 'Failed to fetch earnings summary' });
    }
};

/**
 * POST /api/partners/:id/payout/request
 */
exports.initiatePayout = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, payoutMethod } = req.body; // payoutMethod: 'Bank' | 'UPI'

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // 1. Check partner existence and bank details
        const partner = await prisma.partnerProfile.findUnique({
            where: { id }
        });

        if (!partner) return res.status(404).json({ error: 'Partner not found' });

        const bankInfo = partner.documents?.bank || {};
        if (payoutMethod === 'Bank' && (!bankInfo.accNum || !bankInfo.ifsc)) {
            return res.status(400).json({ error: 'Bank account details missing' });
        }
        if (payoutMethod === 'UPI' && !bankInfo.upiId) {
            return res.status(400).json({ error: 'UPI ID missing' });
        }

        // 2. Re-calculate available balance for safety
        const balanceData = await calculateBalance(id);
        const availableBalance = balanceData.availableBalance || 0;

        if (amount > availableBalance) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // 3. Create Settlement Record
        const paytmOrderId = `PAYOUT_${Date.now()}_${id.slice(0, 4)}`;
        const status = amount > 5000 ? 'Pending' : 'Processing';

        const settlement = await prisma.settlementRequest.create({
            data: {
                partnerId: id,
                amount,
                payoutMethod,
                status,
                paytmOrderId,
            }
        });

        // 4. If Pending (Manual Approval), stop here
        if (status === 'Pending') {
            return res.json({
                success: true,
                message: 'Payout request submitted for admin review (Amount exceeds ₹5,000 threshold).',
                settlement
            });
        }

        // 5. If Processing, call Paytm Payout API
        const response = await processPaytmPayout(settlement, bankInfo);

        if (response.success) {
            const updated = await prisma.settlementRequest.update({
                where: { id: settlement.id },
                data: {
                    status: 'Paid',
                    processedAt: new Date(),
                    paytmResponse: response.data
                }
            });
            return res.json({ success: true, message: 'Payout successful', settlement: updated });
        } else {
            const updated = await prisma.settlementRequest.update({
                where: { id: settlement.id },
                data: {
                    status: 'Failed',
                    failureReason: response.error,
                    paytmResponse: response.raw
                }
            });
            return res.status(500).json({ success: false, error: 'Paytm Payout failed', details: response.error, settlement: updated });
        }

    } catch (err) {
        console.error('initiatePayout Error:', err);
        res.status(500).json({ error: 'Internal server error during payout' });
    }
};

/**
 * Helper to call Paytm Payout API
 */
async function processPaytmPayout(settlement, bankInfo) {
    const MID = process.env.PAYTM_PAYOUT_MID;
    const SECRET_KEY = process.env.PAYTM_PAYOUT_KEY;
    const GUID = process.env.PAYTM_PAYOUT_GUID;

    // Check if we are in mock mode
    if (!MID || MID.includes('MOCK') || !SECRET_KEY) {
        console.log('[MOCK PAYOUT] Processing success for Order:', settlement.paytmOrderId);
        return { success: true, data: { status: 'SUCCESS', message: 'Mock Payout Successful' } };
    }

    try {
        const paytmParams = {
            subwalletGuid: GUID,
            orderId: settlement.paytmOrderId,
            beneficiaryAccount: settlement.payoutMethod === 'Bank' ? bankInfo.accNum : bankInfo.upiId,
            beneficiaryIFSC: settlement.payoutMethod === 'Bank' ? bankInfo.ifsc : undefined,
            amount: settlement.amount.toString(),
            purpose: 'SALARY_SETTLEMENT',
            date: new Date().toISOString().split('T')[0],
        };

        const postData = JSON.stringify(paytmParams);
        const checksum = await paytmChecksum.generateSignature(postData, SECRET_KEY);

        const url = settlement.payoutMethod === 'Bank' 
            ? 'https://dashboard.paytm.com/bpay/api/v1/disburse/order/bank'
            : 'https://dashboard.paytm.com/bpay/api/v1/disburse/order/upi';

        const response = await axios.post(url, postData, {
            headers: {
                'Content-Type': 'application/json',
                'x-paytm-checksum': checksum
            }
        });

        if (response.data?.status === 'SUCCESS' || response.data?.status === 'PENDING') {
            return { success: true, data: response.data };
        } else {
            return { success: false, error: response.data?.statusMessage || 'API Error', raw: response.data };
        }

    } catch (err) {
        console.error('Paytm Payout API Error:', err.response?.data || err.message);
        return { success: false, error: err.message, raw: err.response?.data };
    }
}

/**
 * GET /api/partners/:id/payout/history
 */
exports.getPayoutHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const history = await prisma.settlementRequest.findMany({
            where: { partnerId: id },
            orderBy: { requestedAt: 'desc' }
        });
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch payout history' });
    }
};

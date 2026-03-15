const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mirroring the logic from bookingRoutes.js
function calculateBookingEconomics(orderSource, partnerType, subtotal) {
    let customerFee = 0;
    let commissionRate = 0;

    if (orderSource === 'CustomerApp') {
        customerFee = 10;
        commissionRate = (partnerType === 'Freelancer') ? 0.15 : 0;
    }

    const platformCommission = Math.round(subtotal * commissionRate);
    const totalWithFee = subtotal + customerFee;
    const partnerEarnings = subtotal - platformCommission;

    return {
        platformFee: customerFee,
        partnerEarnings,
        totalWithFee
    };
}

async function runTests() {
    console.log("--- Fee & Commission Calculation Tests ---");

    const cases = [
        { name: "Freelancer (Customer App)", source: "CustomerApp", type: "Freelancer", subtotal: 1000, expectedFee: 10, expectedEarnings: 850 },
        { name: "Salon (Customer App)", source: "CustomerApp", type: "Male_Salon", subtotal: 1000, expectedFee: 10, expectedEarnings: 1000 },
        { name: "Walk-in (Hub)", source: "PartnerHub", type: "Male_Salon", subtotal: 1000, expectedFee: 0, expectedEarnings: 1000 },
        { name: "Cheap Freelancer Service", source: "CustomerApp", type: "Freelancer", subtotal: 100, expectedFee: 10, expectedEarnings: 85 },
    ];

    cases.forEach(c => {
        const result = calculateBookingEconomics(c.source, c.type, c.subtotal);
        const feeMatch = result.platformFee === c.expectedFee;
        const earnMatch = result.partnerEarnings === c.expectedEarnings;

        console.log(`[${feeMatch && earnMatch ? 'PASS' : 'FAIL'}] ${c.name}`);
        if (!feeMatch || !earnMatch) {
            console.log(`  Expected Fee: ${c.expectedFee}, Got: ${result.platformFee}`);
            console.log(`  Expected Earnings: ${c.expectedEarnings}, Got: ${result.partnerEarnings}`);
        }
    });

    process.exit(0);
}

runTests().catch(err => {
    console.error(err);
    process.exit(1);
});

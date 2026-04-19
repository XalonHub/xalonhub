const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const bookings = await prisma.booking.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                status: true,
                bookingDate: true,
                totalAmount: true,
                partnerEarnings: true,
                paymentMethod: true,
                partnerId: true
            }
        });
        console.log('Last 5 bookings:');
        console.log(JSON.stringify(bookings, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBooking() {
    try {
        const b = await prisma.booking.findUnique({
            where: { id: '507d79eb-0f8e-4bfb-9926-00a15322b4fc' }
        });
        console.log(JSON.stringify(b, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

checkBooking();

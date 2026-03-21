const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const booking = await prisma.booking.findUnique({
        where: { id: '1be1e1be-b061-4091-bb7d-e7221b9f85ca' },
        include: { stylist: true }
    });
    console.log(JSON.stringify(booking, null, 2));
    await prisma.$disconnect();
}

main().catch(console.error);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const booking = await prisma.booking.findFirst({
        where: { status: 'Requested' }
    });
    console.log(JSON.stringify(booking, null, 2));
    await prisma.$disconnect();
}

main().catch(console.error);

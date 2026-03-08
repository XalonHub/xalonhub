const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPartners() {
    try {
        const partners = await prisma.partnerProfile.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { user: true }
        });
        console.log('Latest 5 partners:');
        console.log(JSON.stringify(partners, null, 2));
    } catch (err) {
        console.error('Check partners failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkPartners();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const pCount = await prisma.partnerProfile.count();
        const uCount = await prisma.user.count();
        const bCount = await prisma.booking.count();
        console.log('Partners:', pCount);
        console.log('Users:', uCount);
        console.log('Bookings:', bCount);

        // Check categories used by partners
        const partners = await prisma.partnerProfile.findMany({
            select: { categories: true }
        });
        const allUsedCats = new Set(partners.flatMap(p => p.categories));
        console.log('Categories currently used by partners:', Array.from(allUsedCats));

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

check();

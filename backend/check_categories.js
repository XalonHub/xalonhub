const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
    try {
        const categories = await prisma.serviceCatalog.findMany({
            select: { category: true },
            distinct: ['category'],
        });
        console.log('Categories in DB:', categories.map(c => c.category));
    } catch (err) {
        console.error('Database check failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkCategories();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
    try {
        const count = await prisma.serviceCatalog.count();
        console.log('Total services in ServiceCatalog:', count);

        if (count > 0) {
            const sample = await prisma.serviceCatalog.findFirst();
            console.log('Sample service:', JSON.stringify(sample, null, 2));
        }
    } catch (err) {
        console.error('Database check failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkDb();

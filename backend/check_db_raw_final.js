const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
    const services = await prisma.serviceCatalog.findMany({
        where: { category: 'Advanced Skin' }
    });
    console.log(JSON.stringify(services, null, 2));
    await prisma.$disconnect();
}

checkDb();

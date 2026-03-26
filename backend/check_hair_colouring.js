const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHairColouringServices() {
    try {
        const services = await prisma.serviceCatalog.findMany({
            where: { category: 'Hair Colouring' }
        });
        console.log(`Found ${services.length} services for "Hair Colouring"`);
        services.forEach(s => console.log(`- ${s.name}`));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkHairColouringServices();

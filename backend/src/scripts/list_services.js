const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const services = await prisma.serviceCatalog.findMany({
        select: { id: true, name: true, category: true, gender: true, image: true }
    });
    const categories = await prisma.category.findMany({
        select: { id: true, name: true, image: true }
    });
    console.log('--- Categories ---');
    console.log(JSON.stringify(categories, null, 2));
    console.log('--- Services ---');
    console.log(JSON.stringify(services, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

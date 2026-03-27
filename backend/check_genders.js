const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const unisexServices = await prisma.serviceCatalog.findMany({
        where: { gender: 'Unisex' }
    });
    console.log(JSON.stringify(unisexServices, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

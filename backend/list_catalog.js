const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const catalog = await prisma.serviceCatalog.findMany({
        select: { id: true, name: true, category: true, gender: true }
    });
    console.log(JSON.stringify(catalog, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

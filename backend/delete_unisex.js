const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const deleted = await prisma.serviceCatalog.deleteMany({
        where: { id: 'b7d1a7d8-ae81-478f-a513-b9ddfbec8665' }
    });
    console.log(`Deleted ${deleted.count} service(s).`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

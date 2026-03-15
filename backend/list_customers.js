const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const customers = await prisma.customerProfile.findMany({
        include: { user: true }
    });
    console.log('All Customers:');
    console.log(JSON.stringify(customers, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

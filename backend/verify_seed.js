const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    const total = await prisma.serviceCatalog.count();
    const maleServices = await prisma.serviceCatalog.count({ where: { gender: 'Male' } });
    const femaleServices = await prisma.serviceCatalog.count({ where: { gender: 'Female' } });
    const unisexServices = await prisma.serviceCatalog.count({ where: { gender: 'Unisex' } });

    console.log(`Total Services: ${total}`);
    console.log(`Male: ${maleServices}`);
    console.log(`Female: ${femaleServices}`);
    console.log(`Unisex: ${unisexServices}`);

    const categories = await prisma.serviceCatalog.groupBy({
        by: ['category'],
        _count: { _all: true }
    });

    console.log('\nServices by Category:');
    categories.forEach(cat => {
        console.log(`${cat.category}: ${cat._count._all}`);
    });
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

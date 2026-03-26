const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const categories = await prisma.category.findMany();
    categories.forEach(cat => {
        console.log(`Name: ${cat.name}`);
        console.log(`Image: "${cat.image}"`);
        if (cat.image) {
            console.log(`Length: ${cat.image.length}`);
            console.log(`Hex: ${Buffer.from(cat.image).toString('hex')}`);
        }
        console.log('---');
    });
    await prisma.$disconnect();
}

check();

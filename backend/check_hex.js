const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHex() {
    try {
        const categories = await prisma.category.findMany();
        categories.forEach(c => {
            const buf = Buffer.from(c.name);
            console.log(`Name: "${c.name}", Hex: ${buf.toString('hex')}`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkHex();

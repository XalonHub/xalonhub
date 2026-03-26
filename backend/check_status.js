const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
    try {
        const categories = await prisma.category.findMany();
        categories.forEach(c => {
            console.log(`Name: ${c.name}, isActive: ${c.isActive}`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkStatus();

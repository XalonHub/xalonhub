const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllCategories() {
    try {
        const categories = await prisma.category.findMany();
        console.log(JSON.stringify(categories, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAllCategories();

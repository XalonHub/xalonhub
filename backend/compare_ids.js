const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function compare() {
    const categories = await prisma.category.findMany();
    const assets = JSON.parse(fs.readFileSync('all_cloudinary_assets.json', 'utf8'));
    const categoryAssets = assets.filter(a => a.public_id.startsWith('xalon/categories/'));
    const assetIds = categoryAssets.map(a => a.public_id.replace('xalon/categories/', ''));

    console.log('--- DATABASE CATEGORIES ---');
    categories.forEach(cat => {
        const match = assetIds.includes(cat.id);
        console.log(`Name: ${cat.name}`);
        console.log(`ID:   ${cat.id}`);
        console.log(`Match FOUND in Cloudinary: ${match}`);
        console.log('---');
    });
    
    console.log('\n--- ORPHANED CLOUDINARY ASSETS (No DB match) ---');
    assetIds.forEach(id => {
        if (!categories.find(c => c.id === id)) {
            console.log(id);
        }
    });

    await prisma.$disconnect();
}

compare();

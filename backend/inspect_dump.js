require('dotenv').config();
const prisma = require('./src/prisma');
const fs = require('fs');

async function inspect() {
    const partners = await prisma.partnerProfile.findMany({
        take: 10
    });
    fs.writeFileSync('./partners_dump.json', JSON.stringify(partners, null, 2));
    console.log("Dumped to ./partners_dump.json");
}

inspect()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

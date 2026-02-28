const fs = require('fs');
const prisma = require('./src/prisma');
async function run() {
    const partners = await prisma.partnerProfile.findMany({ select: { documents: true, id: true, basicInfo: true }, take: 2 });
    fs.writeFileSync('docs2.json', JSON.stringify(partners, null, 2), 'utf8');
}
run();

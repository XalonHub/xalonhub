const prisma = require('./src/prisma');
async function run() {
    const partners = await prisma.partnerProfile.findMany({ select: { documents: true, id: true, basicInfo: true }, take: 2 });
    console.log(JSON.stringify(partners, null, 2));
}
run();

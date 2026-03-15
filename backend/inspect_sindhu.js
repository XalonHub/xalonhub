
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const sindhu = await prisma.partnerProfile.findFirst({
        where: { basicInfo: { path: ['name'], equals: 'Sindhu' } }
    });

    if (!sindhu) {
        // Try finding by ID if name search fails due to Json nesting
        const all = await prisma.partnerProfile.findMany({ where: { partnerType: 'Freelancer' } });
        console.log("All Freelancers:", JSON.stringify(all, null, 2));
    } else {
        console.log("Sindhu Profile:", JSON.stringify(sindhu, null, 2));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());

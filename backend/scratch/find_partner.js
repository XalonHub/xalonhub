const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const partner = await prisma.partnerProfile.findFirst();
    console.log(JSON.stringify(partner, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

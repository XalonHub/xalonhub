const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const profiles = await prisma.partnerProfile.findMany();
    console.log(JSON.stringify(profiles.map(p => ({ id: p.id, type: p.partnerType, basicInfo: p.basicInfo })), null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

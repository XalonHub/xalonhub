const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const freelancers = await prisma.partnerProfile.findMany({
        where: { partnerType: 'Freelancer' }
    });
    console.log('Freelancers:', JSON.stringify(freelancers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

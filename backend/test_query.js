const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const partners = await prisma.partnerProfile.findMany({
        include: { user: true }
    });
    console.log(JSON.stringify(partners, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

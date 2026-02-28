const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const profiles = await prisma.partnerProfile.findMany({
        include: { user: true }
    });
    console.dir(profiles, { depth: null });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    });

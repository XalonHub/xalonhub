const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
    try {
        const partner = await prisma.partnerProfile.findFirst({
            where: { partnerType: 'Freelancer' }
        });
        console.log(JSON.stringify(partner, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

inspect();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const partner = await prisma.partnerProfile.findFirst({
            where: { 
                partnerType: { not: 'Freelancer' },
                stylists: { some: { isActive: true } }
            },
            include: { stylists: true }
        });
        console.log(JSON.stringify(partner, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

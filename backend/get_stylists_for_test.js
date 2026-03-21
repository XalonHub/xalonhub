const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const partner = await prisma.partnerProfile.findUnique({
            where: { id: '394d0690-fbdf-424f-ae6c-d9a299dae8a1' },
            include: { stylists: true }
        });
        if (partner && partner.stylists) {
            partner.stylists.forEach(s => {
                console.log(`${s.id} : ${s.name} (${s.isActive ? 'Active' : 'Inactive'})`);
            });
        }
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

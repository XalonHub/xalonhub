const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const partners = await prisma.partnerProfile.findMany({
        where: {
            partnerType: {
                in: ['Male_Salon', 'Female_Salon', 'Unisex_Salon']
            }
        },
        select: {
            id: true,
            partnerType: true,
            contractAccepted: true,
            contractAcceptedAt: true,
            basicInfo: true
        }
    });

    console.log('--- Salon Contract Status ---');
    partners.forEach(p => {
        const info = p.basicInfo || {};
        const salonName = info.salonName || info.name || 'Unnamed Salon';
        console.log(`ID: ${p.id}`);
        console.log(`Salon: ${salonName}`);
        console.log(`Type: ${p.partnerType}`);
        console.log(`Accepted: ${p.contractAccepted}`);
        console.log(`Accepted At: ${p.contractAcceptedAt}`);
        console.log('-----------------------------');
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

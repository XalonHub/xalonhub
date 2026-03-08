const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const today = new Date('2026-03-03T11:03:47Z');

    console.log('Updating contracts for all salons...');

    // We update partners who are salons (Male_Salon, Female_Salon, Unisex_Salon)
    const result = await prisma.partnerProfile.updateMany({
        where: {
            partnerType: {
                in: ['Male_Salon', 'Female_Salon', 'Unisex_Salon']
            }
        },
        data: {
            contractAccepted: true,
            contractAcceptedAt: today
        }
    });

    console.log(`Updated ${result.count} salon profiles.`);

    // Let's also verify if there are any freelancers that should be updated
    // The user specifically said "salons", so we'll stick to that.
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

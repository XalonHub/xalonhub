const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const salonId = "5fa3a0b4-6ddc-4758-b0a5-76edaa0cde86";
    console.log(`Fetching specific professional: ${salonId}`);
    try {
        const best = await prisma.partnerProfile.findUnique({
            where: { id: salonId },
            include: { address: true }
        });
        console.log('Result:', JSON.stringify(best, null, 2));
    } catch (err) {
        console.error('DATABASE ERROR:', err);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const partnerId = '4c169f7c-833d-4953-999d-f9890b0e1242';
    const partner = await prisma.partnerProfile.findUnique({
        where: { id: partnerId },
        select: { id: true, salonServices: true }
    });

    const sServices = Array.isArray(partner.salonServices) ? partner.salonServices : [];
    
    for (const ss of sServices) {
        console.log(`Searching for match: "${ss.name}" in "${ss.category}" (${ss.gender})`);
        const matches = await prisma.serviceCatalog.findMany({
            where: {
                name: ss.name,
                category: ss.category,
                gender: ss.gender
            }
        });
        if (matches.length > 0) {
            console.log(`  Found match ID: ${matches[0].id}`);
        } else {
            console.log(`  No exact match found.`);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

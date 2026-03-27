const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const partners = await prisma.partnerProfile.findMany({
        where: { isOnboarded: true },
        select: { id: true, partnerType: true, salonServices: true, categories: true }
    });

    console.log(`Found ${partners.length} onboarded partners.`);

    for (const p of partners) {
        const sServices = Array.isArray(p.salonServices) ? p.salonServices : [];
        console.log(`Partner ${p.id} (${p.partnerType}):`);
        console.log(`  Categories: ${JSON.stringify(p.categories)}`);
        console.log(`  salonServices count: ${sServices.length}`);
        if (sServices.length > 0) {
            console.log(`  First service: ${JSON.stringify(sServices[0])}`);
        }
    }

    const catalogCount = await prisma.serviceCatalog.count();
    console.log(`\nTotal items in serviceCatalog: ${catalogCount}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

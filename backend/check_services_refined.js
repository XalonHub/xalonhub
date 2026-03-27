const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const partnerId = '4c169f7c-833d-4953-999d-f9890b0e1242';
    const partner = await prisma.partnerProfile.findUnique({
        where: { id: partnerId },
        select: { id: true, partnerType: true, salonServices: true, categories: true }
    });

    if (!partner) {
        console.log('Partner not found');
        return;
    }

    console.log('--- Partner Details ---');
    console.log(JSON.stringify(partner, null, 2));

    const sServices = Array.isArray(partner.salonServices) ? partner.salonServices : [];
    const serviceIds = sServices.map(ss => ss.serviceId).filter(Boolean);

    const catalogEntries = await prisma.serviceCatalog.findMany({
        where: { id: { in: serviceIds } },
    });

    console.log('\n--- Catalog Entries Found ---');
    console.log(JSON.stringify(catalogEntries, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

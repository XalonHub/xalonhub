const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Salon Services Data Repair...');
    
    // 1. Fetch all partners
    const partners = await prisma.partnerProfile.findMany({
        where: { isOnboarded: true },
        select: { id: true, partnerType: true, salonServices: true }
    });

    console.log(`Checking ${partners.length} onboarded partners...`);

    // 2. Fetch entire catalog for matching
    const catalog = await prisma.serviceCatalog.findMany();
    const catalogMap = {}; // Key: "name|category|gender"
    catalog.forEach(c => {
        const key = `${c.name.trim().toLowerCase()}|${(c.category || '').trim().toLowerCase()}|${(c.gender || '').trim().toLowerCase()}`;
        catalogMap[key] = c.id;
    });

    for (const p of partners) {
        let sServices = Array.isArray(p.salonServices) ? p.salonServices : [];
        let updated = false;

        const newServices = sServices.map(ss => {
            // Check if serviceId exists in catalog
            const exists = catalog.some(c => c.id === ss.serviceId);
            if (!exists) {
                // Try to find match by name/category/gender
                const key = `${ss.name.trim().toLowerCase()}|${(ss.category || '').trim().toLowerCase()}|${(ss.gender || '').trim().toLowerCase()}`;
                const newId = catalogMap[key];
                if (newId) {
                    console.log(`Partner ${p.id}: Repairing "${ss.name}" -> New ID: ${newId}`);
                    updated = true;
                    return { ...ss, serviceId: newId, id: newId };
                } else {
                    console.warn(`Partner ${p.id}: No catalog match found for "${ss.name}"`);
                }
            }
            return ss;
        });

        if (updated) {
            await prisma.partnerProfile.update({
                where: { id: p.id },
                data: { salonServices: newServices }
            });
            console.log(`Partner ${p.id}: Updated salonServices.`);
        }
    }

    console.log('Repair complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

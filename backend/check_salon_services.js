const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSalonServices() {
    try {
        // Find the only salon (PartnerType not Freelancer) or the latest one
        const salon = await prisma.partnerProfile.findFirst({
            where: {
                partnerType: {
                    in: ['Male_Salon', 'Female_Salon', 'Unisex_Salon']
                }
            },
            include: { user: true }
        });

        if (!salon) {
            console.log('No salon found.');
            return;
        }

        const basicInfo = salon.basicInfo || {};
        console.log('--- Salon Information ---');
        console.log('Salon Name:', basicInfo.salonName || 'N/A');
        console.log('Partner ID:', salon.id);
        console.log('Partner Type:', salon.partnerType);
        console.log('Onboarding Status:', salon.isOnboarded ? 'COMPLETED' : 'INCOMPLETE');
        console.log('-------------------------\n');

        const services = salon.salonServices || [];
        console.log(`Stored Services: ${services.length} items`);

        if (services.length > 0) {
            console.log('\n--- Service Details ---');
            for (const s of services) {
                const catalogItem = await prisma.serviceCatalog.findUnique({
                    where: { id: s.serviceId }
                });

                if (catalogItem) {
                    console.log(`- ${catalogItem.name} (${catalogItem.category})`);
                    console.log(`  Price: ${s.price}, Duration: ${s.duration} mins`);
                } else {
                    console.log(`- Service ID ${s.serviceId} NOT FOUND in Catalog`);
                    console.log(`  Stored Price: ${s.price}, Duration: ${s.duration}`);
                }
            }
        } else {
            console.log('No services stored in salonServices array.');
        }

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkSalonServices();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Verifying table creation in Supabase...');
    console.table({
        User: await prisma.user.count(),
        PartnerProfile: await prisma.partnerProfile.count(),
        ServiceCatalog: await prisma.serviceCatalog.count(),
        Client: await prisma.client.count(),
        Booking: await prisma.booking.count()
    });
    console.log('All tables are verified and exist.');
}
main().catch(console.error).finally(() => prisma.$disconnect());

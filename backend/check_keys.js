const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const partners = await prisma.partnerProfile.findMany({
        where: { isOnboarded: true },
        select: { id: true, partnerType: true, salonServices: true }
    });

    for (const p of partners) {
        const sServices = Array.isArray(p.salonServices) ? p.salonServices : [];
        console.log(`Partner ${p.id} (${p.partnerType}):`);
        sServices.forEach((s, i) => {
            const keys = Object.keys(s);
            console.log(`  Service ${i}: ID=${s.serviceId || s.id}, Keys=[${keys.join(', ')}]`);
        });
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

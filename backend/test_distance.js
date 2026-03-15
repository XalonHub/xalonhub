
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function main() {
    const freelancers = await prisma.partnerProfile.findMany({
        where: { partnerType: 'Freelancer', isOnboarded: true }
    });

    // As per user's test data setup, let's look at the location
    freelancers.forEach(p => {
        const addr = p.address || {};
        console.log(`\nFreelancer: ${p.basicInfo?.name || p.id}`);
        console.log(`Location: Lat ${addr.lat}, Lng ${addr.lng}`);

        // Let's test a sample "user" location near Tenkasi (from previous logs)
        const testUserLat = 8.95;
        const testUserLng = 77.31;

        if (addr.lat && addr.lng) {
            const dist = haversineKm(testUserLat, testUserLng, addr.lat, addr.lng);
            console.log(`Dist to test point (8.95, 77.31): ${dist.toFixed(2)} km`);
        }
    });

    const threading = await prisma.serviceCatalog.findFirst({
        where: { name: { contains: 'threading', mode: 'insensitive' } }
    });
    console.log(`\nThreading Gender: ${threading?.gender}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

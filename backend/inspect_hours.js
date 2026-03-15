
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const freelancers = await prisma.partnerProfile.findMany({
        where: { partnerType: 'Freelancer', isOnboarded: true }
    });

    console.log(`Found ${freelancers.length} onboarded Freelancers.`);

    freelancers.forEach(p => {
        console.log(`\nPartner: ${p.id}`);
        console.log(`Name: ${p.basicInfo?.salonName || p.basicInfo?.name || 'N/A'}`);
        console.log(`Working Hours (${typeof p.workingHours}):`);
        console.log(JSON.stringify(p.workingHours, null, 2));
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());

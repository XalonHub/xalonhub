const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const partners = await prisma.partnerProfile.findMany();
    const sindhu = partners.find(p => {
        const name = JSON.stringify(p.basicInfo).toLowerCase();
        return name.includes('sindhu');
    });

    if (sindhu) {
        console.log('Found Sindhu:');
        console.log(JSON.stringify(sindhu, null, 2));
    } else {
        console.log('Sindhu not found in database.');
        console.log('All partners:', partners.map(p => p.basicInfo?.salonName || p.basicInfo?.name || p.id));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

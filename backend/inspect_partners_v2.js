const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
    try {
        const partners = await prisma.partnerProfile.findMany({
            take: 10,
            include: { user: true }
        });

        partners.forEach(p => {
            console.log(`Partner ID: ${p.id}`);
            console.log(`Name (from basicInfo): ${p.basicInfo?.salonName || p.basicInfo?.name}`);
            console.log(`Documents Keys: ${p.documents ? Object.keys(p.documents).join(', ') : 'null'}`);
            if (p.documents) {
                console.log(`Documents Content: ${JSON.stringify(p.documents, null, 2)}`);
            }
            console.log(`KYC Status: ${p.kycStatus}`);
            console.log('---');
        });
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

inspect();

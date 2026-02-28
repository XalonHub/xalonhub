const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const users = await prisma.user.findMany({
            where: { phone: '9320655303' },
            include: { partnerProfile: true }
        });
        console.log('USER_CHECK_RESULT:' + JSON.stringify(users));

        const allProfiles = await prisma.partnerProfile.count();
        console.log('TOTAL_PROFILES:' + allProfiles);
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();

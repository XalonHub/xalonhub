const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectNulls() {
    const partnerId = '5fa3a0b4-6ddc-4758-b0a5-76edaa0cde86';
    try {
        const partner = await prisma.partnerProfile.findUnique({
            where: { id: partnerId }
        });

        if (!partner) {
            console.log('Partner not found');
            return;
        }

        const stats = {
            nullFields: [],
            emptyFields: [],
            populatedFields: []
        };

        for (const [key, value] of Object.entries(partner)) {
            if (value === null || value === undefined) {
                stats.nullFields.push(key);
            } else if (Array.isArray(value) && value.length === 0) {
                stats.emptyFields.push(key);
            } else if (typeof value === 'object' && Object.keys(value).length === 0) {
                stats.emptyFields.push(key);
            } else {
                stats.populatedFields.push(key);
            }
        }

        console.log('CLEAN_INSPECT_START');
        console.log(JSON.stringify(stats, null, 2));
        console.log('CLEAN_INSPECT_END');

    } catch (err) {
        console.error('Inspection failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

inspectNulls();

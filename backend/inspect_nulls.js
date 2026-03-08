const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectNulls() {
    const partnerId = '5fa3a0b4-6ddc-4758-b0a5-76edaa0cde86';
    try {
        const partner = await prisma.partnerProfile.findUnique({
            where: { id: partnerId },
            include: { user: true }
        });

        if (!partner) {
            console.log('Partner not found');
            return;
        }

        console.log('--- Salon Registration Null Check ---');
        console.log('Partner ID:', partner.id);
        console.log('Partner Type:', partner.partnerType);

        const nullFields = [];
        const emptyFields = [];

        const checkValue = (key, value) => {
            if (value === null || value === undefined) {
                nullFields.push(key);
            } else if (Array.isArray(value) && value.length === 0) {
                emptyFields.push(key);
            } else if (typeof value === 'object' && Object.keys(value).length === 0) {
                emptyFields.push(key);
            }
        };

        // Root fields
        checkValue('basicInfo', partner.basicInfo);
        checkValue('address', partner.address);
        checkValue('categories', partner.categories);
        checkValue('workPreferences', partner.workPreferences);
        checkValue('workingHours', partner.workingHours);
        checkValue('documents', partner.documents);
        checkValue('professionalDetails', partner.professionalDetails);
        checkValue('salonServices', partner.salonServices);
        checkValue('salonCover', partner.salonCover);
        checkValue('coverImages', partner.coverImages);
        checkValue('kycRejectedReason', partner.kycRejectedReason);

        console.log('\nNull Fields:', nullFields);
        console.log('Empty Fields (Arrays/Objects):', emptyFields);

        console.log('\n--- Detail of JSON fields if not null ---');
        if (partner.basicInfo) console.log('basicInfo:', JSON.stringify(partner.basicInfo, null, 2));
        if (partner.address) console.log('address:', JSON.stringify(partner.address, null, 2));
        if (partner.documents) console.log('documents:', JSON.stringify(partner.documents, null, 2));
        if (partner.salonServices) console.log('salonServices:', partner.salonServices.length, 'items');

        console.log('\nOnboarding Status:', partner.isOnboarded ? 'COMPLETED' : 'INCOMPLETE');
        console.log('------------------------------------');

    } catch (err) {
        console.error('Inspection failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

inspectNulls();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateData() {
    console.log('Starting Data Migration...');
    const partners = await prisma.partnerProfile.findMany();

    for (const p of partners) {
        let docs = p.documents || {};
        let newBankDetails = p.bankDetails || {};
        let newKyc = {};

        // 1. Extract Bank Info
        if (docs.bank) {
            newBankDetails = typeof docs.bank === 'string' ? JSON.parse(docs.bank) : docs.bank;
            delete docs.bank;
        }

        // 2. Extract KYC Info
        const kycDocs = (typeof docs.kycDocuments === 'string' ? JSON.parse(docs.kycDocuments) : docs.kycDocuments) || {};
        newKyc = { ...kycDocs };

        // 3. Move flat fields to KYC
        const kycKeys = [
            'aadhaarFront', 'aadhaarBack', 'aadhaarNum', 
            'licenseNum', 'licenseImg', 'hasLicense', 'dlName', 'dlDob',
            'hasPoliceCert', 'policeNum', 'policeImg', 'regCertificateNum', 'regCertificateImg',
            'showcaseImages', 'kycStatus'
        ];
        kycKeys.forEach(key => {
            if (docs[key] !== undefined) {
                newKyc[key] = docs[key];
                delete docs[key];
            }
        });

        // 4. Cleanup and Save
        console.log(`Migrating partner ${p.id}...`);
        await prisma.partnerProfile.update({
            where: { id: p.id },
            data: {
                bankDetails: newBankDetails,
                documents: { kyc: newKyc },
                kycStatus: newKyc.kycStatus || p.kycStatus || 'pending'
            }
        });
    }

    console.log('Migration complete.');
}

migrateData().finally(() => prisma.$disconnect());

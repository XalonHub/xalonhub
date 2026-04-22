const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedKycData() {
    const partners = [
        { phone: '7810035788', type: 'Freelancer' },
        { phone: '8960046001', type: 'Salon' }
    ];

    for (const p of partners) {
        const user = await prisma.user.findUnique({ where: { phone: p.phone }, include: { partnerProfile: true } });
        if (!user || !user.partnerProfile) continue;

        console.log(`Seeding KYC for ${p.phone} (${p.type})...`);

        const dummyDocs = {
            aadhaarNum: "9632 5807 4125",
            aadhaarFront: "https://res.cloudinary.com/divyyczmu/image/upload/v1774771884/xalon/partners/5ff51e76-6e98-496d-8345-7502101c2063/documents/xalon/partners/5ff51e76-6e98-496d-8345-7502101c2063/documents/aadhaarFront.jpg",
            aadhaarBack: "https://res.cloudinary.com/divyyczmu/image/upload/v1774771890/xalon/partners/5ff51e76-6e98-496d-8345-7502101c2063/documents/xalon/partners/5ff51e76-6e98-496d-8345-7502101c2063/documents/aadhaarBack.jpg",
            hasPoliceCert: true,
            policeNum: "POL-789-XYZ",
            policeImg: "https://res.cloudinary.com/divyyczmu/image/upload/v1774771912/xalon/partners/5ff51e76-6e98-496d-8345-7502101c2063/documents/xalon/partners/5ff51e76-6e98-496d-8345-7502101c2063/documents/policeImg.jpg",
            kycStatus: "approved"
        };

        if (p.type === 'Salon') {
            dummyDocs.regCertificateNum = "REG-5566-SALON";
            dummyDocs.regCertificateImg = "https://res.cloudinary.com/divyyczmu/image/upload/v1774771946/xalon/partners/5ff51e76-6e98-496d-8345-7502101c2063/documents/xalon/partners/5ff51e76-6e98-496d-8345-7502101c2063/documents/regCertificateImg.jpg";
        } else {
            dummyDocs.licenseNum = "DL-SIN-9988";
            dummyDocs.licenseImg = "https://res.cloudinary.com/divyyczmu/image/upload/v1774771884/xalon/partners/5ff51e76-6e98-496d-8345-7502101c2063/documents/xalon/partners/5ff51e76-6e98-496d-8345-7502101c2063/documents/aadhaarFront.jpg";
            dummyDocs.hasLicense = true;
        }

        await prisma.partnerProfile.update({
            where: { id: user.partnerProfile.id },
            data: {
                kycStatus: 'approved',
                documents: {
                    ...user.partnerProfile.documents,
                    ...dummyDocs,
                    kycDocuments: dummyDocs
                }
            }
        });
    }

    console.log('Seeding complete.');
}

seedKycData().finally(() => prisma.$disconnect());

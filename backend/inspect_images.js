const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- PartnerProfile image fields check ---');
    const partners = await prisma.partnerProfile.findMany({
        select: {
            id: true,
            partnerType: true,
            basicInfo: true,
            salonCover: true,
            coverImages: true,
            documents: true
        }
    });

    const mapped = partners.map(p => {
        const basic = p.basicInfo || {};
        const cover = p.salonCover || {};
        const docs = p.documents || {};

        return {
            id: p.id,
            name: basic.businessName || basic.name || 'Unnamed',
            coverImage: cover.outside?.[0] || cover.inside?.[0] || basic.profileImg || docs.shopFrontImg || p.coverImages?.[0] || null,
            allImages: [
                ...(cover.outside || []),
                ...(cover.inside || []),
                ...(p.coverImages || []),
                ...(docs.showcaseImages || []),
                basic.profileImg,
                docs.shopFrontImg,
            ].filter(Boolean)
        };
    });

    console.log(JSON.stringify(mapped, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

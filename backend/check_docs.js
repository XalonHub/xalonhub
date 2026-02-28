const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function check() {
    const partners = await prisma.partnerProfile.findMany({ select: { id: true, documents: true } });
    const docs = partners.map(p => ({
        id: p.id,
        documents: p.documents
    }));
    fs.writeFileSync('docs.txt', JSON.stringify(docs, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());

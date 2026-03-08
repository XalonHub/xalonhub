const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { phone: '7810035788' },
        include: {
            partnerProfile: true,
            customerProfile: { include: { addresses: true } }
        }
    });

    fs.writeFileSync('output.json', JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

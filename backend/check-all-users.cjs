const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            phone: true,
            role: true
        }
    });

    console.log("All users in DB:");
    console.dir(users, { depth: null });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

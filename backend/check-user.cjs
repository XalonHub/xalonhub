const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { phone: '9320655303' },
        include: {
            partnerProfile: true,
        },
    });

    if (user) {
        console.log("User found:");
        console.dir(user, { depth: null });
    } else {
        console.log("User not found with phone 9320655303.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());

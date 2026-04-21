const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const services = await prisma.serviceCatalog.findMany({
        where: {
            OR: [
                { name: "Classic Straight Razor Shave", gender: "Male" },
                { name: "Charcoal Deep Clean-up", gender: "Male" },
                { name: "Korean Glass Skin Facial", gender: "Female" },
                { name: "Head Shave (Smooth Razor)", gender: "Male" }
            ]
        },
        select: { id: true, name: true, gender: true }
    });
    console.log(JSON.stringify(services, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

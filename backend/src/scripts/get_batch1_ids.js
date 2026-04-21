const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const services = await prisma.serviceCatalog.findMany({
        where: {
            OR: [
                { name: "Premium Haircut", gender: "Male" },
                { name: "Beard Sculpting", gender: "Male" },
                { name: "Advanced Layer Cut", gender: "Female" }
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

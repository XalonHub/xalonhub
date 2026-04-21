const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const services = await prisma.serviceCatalog.findMany({
        where: {
            OR: [
                { name: "Root Touch-up (Men)", gender: "Male" },
                { name: "Intensive Anti-Dandruff Spa", gender: "Male" },
                { name: "Professional HydraFacial", gender: "Male" },
                { name: "Full Body Swedish Massage", gender: "Male" },
                { name: "The Executive Bundle", gender: "Male" },
                { name: "Women: Hair Highlights", gender: "Female" },
                { name: "Women: Botox Treatment", gender: "Female" },
                { name: "Women: Loreal Hair Spa", gender: "Female" },
                { name: "Women: Head Massage", gender: "Female" },
                { name: "Women: Saree Draping", gender: "Female" }
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

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const services = await prisma.serviceCatalog.findMany({
        where: {
            OR: [
                { name: "Complete Chest & Back Wax", gender: "Male" },
                { name: "Brow Clean-up (Men)", gender: "Male" },
                { name: "Executive Gentleman's Pedicure", gender: "Male" },
                { name: "Full Body Waxing (Rica)", gender: "Female" },
                { name: "Eyebrow & Upper Lip Threading", gender: "Female" },
                { name: "Spa Pedicure (Women)", gender: "Female" },
                { name: "Luxury French Manicure", gender: "Female" },
                { name: "Anti-Tan Foot Spa", gender: "Male" }
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

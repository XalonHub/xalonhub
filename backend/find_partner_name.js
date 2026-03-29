const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const partner = await prisma.partnerProfile.findUnique({
    where: { id: "afb31cd5-4b90-405c-9ee6-7ce3c33723aa" }
  });
  console.log(JSON.stringify(partner, null, 2));
}

main().finally(() => prisma.$disconnect());

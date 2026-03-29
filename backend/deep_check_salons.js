const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const salons = await prisma.salon.findMany({
      include: { partner: true }
  });
  console.log(`Total Salons: ${salons.length}`);
  salons.forEach(s => {
      console.log(`ID: ${s.id}, Name: ${s.name}, City: ${s.city}, PartnerID: ${s.partnerId}, IsActive: ${s.isActive}`);
  });
}

main().finally(() => prisma.$disconnect());

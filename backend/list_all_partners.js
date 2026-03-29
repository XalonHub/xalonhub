const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const partners = await prisma.partnerProfile.findMany({
    include: { user: true }
  });
  
  console.log(`Total Partners: ${partners.length}`);
  partners.forEach(p => {
      console.log(`ID: ${p.id}, Name: ${p.basicInfo?.name}, Role: ${p.user?.role}, Phone: ${p.user?.phone}, Onboarded: ${p.isOnboarded}`);
  });
}

main().finally(() => prisma.$disconnect());

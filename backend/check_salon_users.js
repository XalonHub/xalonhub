const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log(`--- Checking all Users for Salon Roles ---`);
  
  const users = await prisma.user.findMany({
      where: {
          role: { in: ['Male_Salon', 'Female_Salon', 'Unisex_Salon'] }
      },
      include: { partnerProfile: true }
  });

  console.log(`Users with Salon Roles: ${users.length}`);
  users.forEach(u => {
      console.log(`ID: ${u.id}, Phone: ${u.phone}, Role: ${u.role}, HasPartnerProfile: ${!!u.partnerProfile}`);
  });
}

main().finally(() => prisma.$disconnect());

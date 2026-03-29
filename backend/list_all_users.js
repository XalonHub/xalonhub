const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log(`--- Listing All Users ---`);
  
  const users = await prisma.user.findMany();

  console.log(`Total Users: ${users.length}`);
  users.forEach(u => {
      console.log(`ID: ${u.id}, Phone: ${u.phone}, Role: ${u.role}`);
  });
}

main().finally(() => prisma.$disconnect());

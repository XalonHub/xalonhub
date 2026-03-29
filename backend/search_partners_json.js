const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phone = "9865783321";
  console.log(`--- Searching for phone ${phone} in all PartnerProfile basicInfo ---`);
  
  const partners = await prisma.partnerProfile.findMany();
  
  for (const p of partners) {
      const basic = p.basicInfo || {};
      if (JSON.stringify(basic).includes(phone)) {
          console.log(`Match found in Partner ID: ${p.id}`);
          console.log(JSON.stringify(p, null, 2));
      }
  }
}

main().finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log(`--- Checking for Orphaned PartnerProfiles ---`);
  
  const orphans = await prisma.partnerProfile.findMany({
      where: {
          user: null
      }
  });

  console.log(`Found ${orphans.length} orphaned partner profiles.`);
  orphans.forEach(p => console.log(JSON.stringify(p, null, 2)));
}

main().finally(() => prisma.$disconnect());

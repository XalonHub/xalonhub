const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phone = "9865783321";
  console.log(`--- Checking for PartnerProfile with phone: ${phone} ---`);
  
  // Checking for PartnerProfile that might have this phone linked in its data
  const partners = await prisma.partnerProfile.findMany({
    include: { user: true }
  });

  const matchingPartner = partners.find(p => p.phone === phone || (p.user && p.user.phone === phone));

  if (matchingPartner) {
    console.log("Found matching partner profile:");
    console.log(JSON.stringify(matchingPartner, null, 2));
  } else {
    console.log("No partner profile found with this phone number.");
  }
}

main().finally(() => prisma.$disconnect());

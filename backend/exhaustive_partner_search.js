const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log(`--- Exhaustive Partner Search ---`);
  
  const allPartners = await prisma.partnerProfile.findMany({
      include: { user: true }
  });

  console.log(`Total PartnerProfiles in DB: ${allPartners.length}`);
  
  allPartners.forEach(p => {
      const basic = p.basicInfo || {};
      const addr = p.address || {};
      console.log(`-----------------------------------`);
      console.log(`ID: ${p.id}`);
      console.log(`Name: ${basic.businessName || basic.name || p.name || 'N/A'}`);
      console.log(`Type: ${p.partnerType}`);
      console.log(`Phone: ${p.user?.phone || 'N/A'}`);
      console.log(`City/District: ${addr.city || addr.district || 'N/A'}`);
      console.log(`Onboarded: ${p.isOnboarded}`);
      console.log(`KYC Status: ${p.kycStatus}`);
  });
}

main().finally(() => prisma.$disconnect());

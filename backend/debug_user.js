const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phone = "9865783321";
  console.log(`--- Investigating User with phone: ${phone} ---`);
  
  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      partnerProfile: true,
      customerProfile: true
    }
  });

  if (!user) {
    console.log("No user found with this phone number.");
  } else {
    console.log("User found:");
    console.log(JSON.stringify(user, null, 2));
    
    if (user.partnerProfile) {
        console.log("\nPartner Profile found:");
        console.log(`ID: ${user.partnerProfile.id}`);
        console.log(`Type: ${user.partnerProfile.partnerType}`);
        console.log(`Onboarding Step: ${user.partnerProfile.onboardingStep}`);
        console.log(`KYC Status: ${user.partnerProfile.kycStatus}`);
        console.log(`Is Online: ${user.partnerProfile.isOnline}`);
    } else {
        console.log("\nNo Partner Profile associated with this user.");
    }
  }
}

main().finally(() => prisma.$disconnect());

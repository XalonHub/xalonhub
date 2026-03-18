const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit(profileId) {
  try {
    const profile = await prisma.partnerProfile.findUnique({
      where: { id: profileId },
      include: {
        user: true,
        stylists: true,
      }
    });

    if (!profile) {
      console.log('Profile not found');
      return;
    }

    console.log('--- Partner Profile Audit ---');
    console.log('ID:', profile.id);
    console.log('Phone:', profile.user?.phone || profile.phone);
    console.log('Name:', profile.basicInfo?.name || profile.name);
    console.log('Onboarding Status:', profile.onboardingStatus);
    console.log('--- Address ---');
    console.log(JSON.stringify(profile.address, null, 2));
    console.log('--- Bank & Documents ---');
    console.log(JSON.stringify(profile.documents, null, 2));
    console.log('--- Working Hours ---');
    console.log(JSON.stringify(profile.workingHours, null, 2));
    console.log('---------------------------');
  } catch (error) {
    console.error('Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const pid = process.argv[2];
if (!pid) {
  console.log('Usage: node final_audit.js <profile_id>');
  process.exit(1);
}

audit(pid);

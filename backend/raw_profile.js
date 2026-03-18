const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getRaw(profileId) {
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

    console.log(JSON.stringify(profile, null, 2));
  } catch (error) {
    console.error('Fetch failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const pid = process.argv[2];
if (!pid) {
  console.log('Usage: node raw_profile.js <profile_id>');
  process.exit(1);
}

getRaw(pid);

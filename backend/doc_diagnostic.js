const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocs(profileId) {
  try {
    const profile = await prisma.partnerProfile.findUnique({
      where: { id: profileId }
    });

    if (!profile) {
      console.log('Profile not found');
      return;
    }

    console.log('=== Partner Documents Diagnostic ===');
    console.log('ID:', profile.id);
    console.log('Type:', profile.partnerType);
    console.log('KYC Status:', profile.kycStatus);
    console.log('isOnboarded:', profile.isOnboarded);
    console.log('Raw Documents:', JSON.stringify(profile.documents, null, 2));
    console.log('Salon Cover:', JSON.stringify(profile.salonCover, null, 2));
    console.log('====================================');
  } catch (error) {
    console.error('Diagnostic failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const pid = process.argv[2] || '394d0690-fbdf-424f-ae6c-d9a299dae8a1';
checkDocs(pid);

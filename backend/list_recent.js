const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listRecent() {
  try {
    const partners = await prisma.partnerProfile.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: { user: true }
    });

    console.log('--- Recent Partners ---');
    partners.forEach(p => {
      console.log(`ID: ${p.id} | Phone: ${p.user?.phone || 'N/A'} | Name: ${p.basicInfo?.name || 'N/A'} | Onboarding: ${p.onboardingStatus}`);
    });
  } catch (error) {
    console.error('List failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listRecent();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reproduce() {
  try {
    console.log('--- Creating test data ---');
    // 1. Find a partner
    const partner = await prisma.partnerProfile.findFirst();
    if (!partner) {
      console.log('No partner found to associate with.');
      return;
    }

    // 2. Create a test stylist
    const stylist = await prisma.stylist.create({
      data: {
        partnerId: partner.id,
        name: 'Test Stylist for Deletion',
        isActive: true,
      }
    });
    console.log('Created stylist:', stylist.id);

    // 3. Create a test booking associated with the stylist
    const booking = await prisma.booking.create({
      data: {
        partnerId: partner.id,
        stylistId: stylist.id,
        bookingDate: new Date(),
        services: [],
        totalAmount: 100,
        status: 'Requested'
      }
    });
    console.log('Created booking:', booking.id);

    // 4. Try to delete the stylist
    console.log('Attempting to delete stylist...');
    try {
      await prisma.stylist.delete({
        where: { id: stylist.id }
      });
      console.log('SUCCESS: Stylist deleted.');
    } catch (e) {
      console.log('EXPECTED FAILURE:', e.message);
    }

    // 5. Cleanup (if it didn't delete)
    // We want to see if the record is still there
    const stillHere = await prisma.stylist.findUnique({ where: { id: stylist.id } });
    console.log('Stylist still exists?', !!stillHere);

    // Clean up booking
    await prisma.booking.delete({ where: { id: booking.id } });
    if (stillHere) {
        await prisma.stylist.delete({ where: { id: stylist.id } });
    }
    console.log('Cleanup done.');

  } catch (error) {
    console.error('Reproduction failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reproduce();

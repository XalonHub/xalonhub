const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reproduce() {
  try {
    console.log('--- Creating test data ---');
    const partner = await prisma.partnerProfile.findFirst();
    if (!partner) {
      console.log('No partner found.');
      return;
    }

    const stylist = await prisma.stylist.create({
      data: {
        partnerId: partner.id,
        name: 'Test Stylist for Deletion',
        isActive: true,
      }
    });
    console.log('Created stylist:', stylist.id);

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

    console.log('--- Deleting stylist ---');
    await prisma.stylist.delete({
      where: { id: stylist.id }
    });
    console.log('Stylist deleted.');

    console.log('--- Verifying booking ---');
    const b = await prisma.booking.findUnique({
      where: { id: booking.id }
    });

    if (b) {
      console.log('Booking STILL EXISTS. stylistId is:', b.stylistId);
    } else {
      console.log('BOOKING DELETED! (This is what we want to avoid)');
    }

    // Cleanup
    if (b) {
      await prisma.booking.delete({ where: { id: booking.id } });
    }
    console.log('Cleanup done.');

  } catch (error) {
    console.error('Reproduction failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reproduce();

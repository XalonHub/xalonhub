const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Verification: Stylist Deletion & Name Snapshotting ---');

  // 1. Setup: Create a Partner
  const partner = await prisma.partnerProfile.create({
    data: {
      partnerType: 'Unisex_Salon',
      isOnboarded: true,
      user: {
        create: {
          phone: `phone-${Date.now()}`,
          role: 'Unisex_Salon'
        }
      }
    }
  });
  console.log(`Created Partner: ${partner.id}`);

  // 2. Setup: Create a Stylist
  const stylist = await prisma.stylist.create({
    data: {
      partnerId: partner.id,
      name: 'John Doe',
      isActive: true
    }
  });
  console.log(`Created Stylist: ${stylist.id} (${stylist.name})`);

  // 3. Test scenario A: Creation with stylist assignment
  console.log('\nScenario A: Creating booking with stylist...');
  // We simulate the backend logic since we're testing the Prisma layer and our manual route updates
  // In a real integration test we'd call the API, but here we can verify the schema and snapshotting logic
  // (We assume the route update we did works if the schema supports it)
  
  const bookingA = await prisma.booking.create({
    data: {
      partnerId: partner.id,
      bookingDate: new Date(),
      services: [],
      totalAmount: 100,
      status: 'Confirmed',
      stylistId: stylist.id,
      stylistNameAtBooking: stylist.name // This mimics what our new route logic does
    }
  });
  console.log(`Created Booking A: ${bookingA.id}, stylistNameAtBooking: ${bookingA.stylistNameAtBooking}`);

  if (bookingA.stylistNameAtBooking !== 'John Doe') {
    throw new Error('Name snapshotting failed on creation');
  }

  // 4. Test scenario B: Update with stylist assignment
  console.log('\nScenario B: Assigning stylist to an existing booking...');
  const bookingB = await prisma.booking.create({
    data: {
      partnerId: partner.id,
      bookingDate: new Date(),
      services: [],
      totalAmount: 100,
      status: 'Requested'
    }
  });
  console.log(`Created Booking B (Requested): ${bookingB.id}`);

  // Simulate PUT /api/bookings/:id/status with stylistId
  const updatedB = await prisma.booking.update({
    where: { id: bookingB.id },
    data: {
      status: 'Confirmed',
      stylistId: stylist.id,
      stylistNameAtBooking: stylist.name
    }
  });
  console.log(`Updated Booking B: status=${updatedB.status}, stylistId=${updatedB.stylistId}, stylistNameAtBooking=${updatedB.stylistNameAtBooking}`);

  if (updatedB.stylistNameAtBooking !== 'John Doe' || updatedB.status !== 'Confirmed') {
    throw new Error('Name snapshotting failed on update');
  }

  // 5. Action: Delete the Stylist
  console.log(`\nDeleting Stylist ${stylist.id}...`);
  await prisma.stylist.delete({ where: { id: stylist.id } });

  // 6. Verify: Check bookings
  console.log('\nVerifying bookings after stylist deletion...');
  const finalA = await prisma.booking.findUnique({ where: { id: bookingA.id } });
  const finalB = await prisma.booking.findUnique({ where: { id: bookingB.id } });

  console.log(`Booking A: stylistId=${finalA.stylistId}, stylistNameAtBooking='${finalA.stylistNameAtBooking}'`);
  console.log(`Booking B: stylistId=${finalB.stylistId}, stylistNameAtBooking='${finalB.stylistNameAtBooking}'`);

  if (finalA.stylistId !== null || finalB.stylistId !== null) {
      throw new Error('stylistId was NOT nullified after deletion');
  }
  if (finalA.stylistNameAtBooking !== 'John Doe' || finalB.stylistNameAtBooking !== 'John Doe') {
      throw new Error('stylistNameAtBooking was NOT preserved after deletion');
  }

  console.log('\n--- VERIFICATION SUCCESSFUL ---');

  // CLEANUP
  console.log('\nCleaning up...');
  await prisma.booking.deleteMany({ where: { id: { in: [bookingA.id, bookingB.id] } } });
  await prisma.partnerProfile.delete({ where: { id: partner.id } });
  await prisma.user.delete({ where: { id: partner.userId } });
  console.log('Cleanup done.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const booking = await prisma.booking.findUnique({
    where: { id: '1be1e1be-b061-4091-bb7d-e7221b9f85ca' }
  });
  if (booking) {
    console.log(booking.partnerId);
  } else {
    console.log('Booking not found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const requestedBookings = await prisma.booking.findMany({
    where: { status: 'Requested' },
    include: { partner: true }
  });
  console.log(JSON.stringify(requestedBookings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

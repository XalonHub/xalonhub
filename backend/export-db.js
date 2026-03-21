const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  const data = {
    users: await prisma.user.findMany({ include: { customerProfile: true, partnerProfile: true } }),
    customers: await prisma.customerProfile.findMany(),
    partners: await prisma.partnerProfile.findMany(),
    bookings: await prisma.booking.findMany(),
    servicesCount: await prisma.serviceCatalog.count(),
    stylists: await prisma.stylist.findMany(),
    clients: await prisma.client.findMany(),
  };

  fs.writeFileSync('db-export.json', JSON.stringify(data, null, 2));
  console.log('Database exported to db-export.json');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

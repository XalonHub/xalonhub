const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Detailed Database Check ---');
  
  const users = await prisma.user.findMany({ include: { customerProfile: true, partnerProfile: true } });
  console.log(`Total Users: ${users.length}`);
  users.forEach(u => {
    console.log(`User ID: ${u.id} | Phone: ${u.phone} | Role: ${u.role} | Has Customer: ${!!u.customerProfile} | Has Partner: ${!!u.partnerProfile}`);
  });

  const customers = await prisma.customerProfile.findMany();
  console.log(`\nTotal Customer Profiles: ${customers.length}`);
  customers.forEach(c => {
    console.log(`Customer ID: ${c.id} | Name: ${c.name} | UserID: ${c.userId}`);
  });

  const partners = await prisma.partnerProfile.findMany();
  console.log(`\nTotal Partner Profiles: ${partners.length}`);
  partners.forEach(p => {
    const basicInfo = p.basicInfo || {};
    console.log(`Partner ID: ${p.id} | Name: ${basicInfo.name || 'N/A'} | Type: ${p.partnerType} | KYC: ${p.kycStatus} | UserID: ${p.userId}`);
  });

  const bookings = await prisma.booking.findMany();
  console.log(`\nTotal Bookings: ${bookings.length}`);
  bookings.forEach(b => {
    console.log(`Booking ID: ${b.id} | Status: ${b.status} | Date: ${b.bookingDate} | CustomerID: ${b.customerId} | PartnerID: ${b.partnerId}`);
  });

  const serviceCount = await prisma.serviceCatalog.count();
  console.log(`\nTotal Services in Catalog: ${serviceCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

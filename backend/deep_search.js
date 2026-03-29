const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phone = "9865783321";
  console.log(`--- Deep Search for ${phone} ---`);
  
  // Search Users
  const users = await prisma.user.findMany({ where: { phone: { contains: phone } } });
  console.log(`Users found: ${users.length}`);
  users.forEach(u => console.log(`User ID: ${u.id}, Role: ${u.role}, Phone: ${u.phone}`));

  // Search Clients
  const clients = await prisma.client.findMany({ where: { phone: { contains: phone } } });
  console.log(`Clients found: ${clients.length}`);
  clients.forEach(c => console.log(`Client ID: ${c.id}, Name: ${c.name}, Phone: ${c.phone}, PartnerID: ${c.partnerId}`));

  // Search Bookings (beneficiaryPhone)
  const bookings = await prisma.booking.findMany({ where: { beneficiaryPhone: { contains: phone } } });
  console.log(`Bookings (beneficiary) found: ${bookings.length}`);
  
  // Search Partners by name "Sindhuja"
  const partnersByName = await prisma.partnerProfile.findMany();
  const filtered = partnersByName.filter(p => JSON.stringify(p).includes("Sindhuja"));
  console.log(`Partners with name 'Sindhuja' found: ${filtered.length}`);
  filtered.forEach(p => console.log(`Partner ID: ${p.id}, Onboarded: ${p.isOnboarded}`));

}

main().finally(() => prisma.$disconnect());

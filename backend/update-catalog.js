
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const { SERVICES } = require('./src/data/fullServiceCatalog');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Service Catalog Enrichment...\n');

  // 1. Fetch all existing services
  const existingServices = await prisma.serviceCatalog.findMany();
  console.log(`Found ${existingServices.length} existing services in DB.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const service of SERVICES) {
    const existing = existingServices.find(s => 
      s.name.toLowerCase().trim() === service.name.toLowerCase().trim() &&
      s.gender === service.gender
    );

    if (existing) {
      // UPDATE
      await prisma.serviceCatalog.update({
        where: { id: existing.id },
        data: {
          duration: service.duration,
          defaultPrice: service.price,
          steps: service.steps,
          faqs: service.faqs,
          updatedAt: new Date()
        }
      });
      console.log(`✅ UPDATED: [${service.gender}] ${service.name}`);
      updatedCount++;
    } else {
      // CREATE
      await prisma.serviceCatalog.create({
        data: {
          id: uuidv4(),
          name: service.name,
          category: service.category,
          gender: service.gender,
          duration: service.duration,
          defaultPrice: service.price,
          steps: service.steps,
          faqs: service.faqs,
          priceType: 'Fixed',
          updatedAt: new Date()
        }
      });
      console.log(`✨ CREATED: [${service.gender}] ${service.name}`);
      createdCount++;
    }
  }

  console.log(`\n🎉 Finished!`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Created: ${createdCount}`);
}

main()
  .catch(e => {
    console.error('❌ Error updating catalog:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

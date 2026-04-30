const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); // Default uses the env var set by the OS/dotenv

async function fixPaths() {
  console.log('--- Fixing Image Paths from PROD to DEV ---');
  
  try {
    // 1. Update Categories
    const categories = await prisma.category.findMany();
    let catUpdates = 0;
    for (const cat of categories) {
      if (cat.image && cat.image.startsWith('prod/')) {
        const newImage = cat.image.replace(/^prod\//, 'dev/');
        await prisma.category.update({
          where: { id: cat.id },
          data: { image: newImage }
        });
        catUpdates++;
      }
    }
    console.log(`Updated ${catUpdates} Category image paths.`);

    // 2. Update Service Catalog
    const services = await prisma.serviceCatalog.findMany();
    let serviceUpdates = 0;
    for (const srv of services) {
      if (srv.image && srv.image.startsWith('prod/')) {
        const newImage = srv.image.replace(/^prod\//, 'dev/');
        await prisma.serviceCatalog.update({
          where: { id: srv.id },
          data: { image: newImage }
        });
        serviceUpdates++;
      }
    }
    console.log(`Updated ${serviceUpdates} Service image paths.`);

    console.log('--- Path Fix Completed! ---');
  } catch (error) {
    console.error('Error fixing paths:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPaths();

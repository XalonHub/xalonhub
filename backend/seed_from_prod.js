const { PrismaClient } = require('@prisma/client');
const prodUrl = "postgresql://postgres.nffxfykqrzudxwrejlqn:98%3FD%26XFQmY.iz%25X@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const devUrl = "postgresql://postgres.mxmruduiqbxhynzyqpzz:APK%26SSjk%2Bf33%25FD@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres";

const prismaProd = new PrismaClient({
  datasourceUrl: prodUrl,
});

const prismaDev = new PrismaClient({
  datasourceUrl: devUrl,
});

async function main() {
  console.log('--- Starting Data Sync from PROD to DEV ---');
  console.log('Connecting to Prod:', prodUrl.split('@')[1]);
  console.log('Connecting to Dev:', devUrl.split('@')[1]);

  try {
    // 1. Migrate Global Settings
    console.log('Fetching Global Settings...');
    const settings = await prismaProd.globalSettings.findMany();
    if (settings.length > 0) {
      await prismaDev.globalSettings.deleteMany();
      await prismaDev.globalSettings.createMany({ data: settings });
      console.log(`Migrated ${settings.length} Global Settings.`);
    }

    // 2. Migrate Categories
    console.log('Fetching Categories...');
    const categories = await prismaProd.category.findMany();
    if (categories.length > 0) {
      await prismaDev.category.deleteMany();
      await prismaDev.category.createMany({ data: categories });
      console.log(`Migrated ${categories.length} Categories.`);
    }

    // 3. Migrate Service Catalog
    console.log('Fetching Service Catalog...');
    const services = await prismaProd.serviceCatalog.findMany();
    if (services.length > 0) {
      await prismaDev.serviceCatalog.deleteMany();
      await prismaDev.serviceCatalog.createMany({ data: services });
      console.log(`Migrated ${services.length} Services.`);
    }

    console.log('--- Sync Completed Successfully! ---');
  } catch (error) {
    console.error('Error during sync:', error);
  } finally {
    await prismaProd.$disconnect();
    await prismaDev.$disconnect();
  }
}

main();

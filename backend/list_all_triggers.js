const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const triggers = await prisma.$queryRaw`
    SELECT event_object_schema, event_object_table, trigger_name, event_manipulation, action_statement, action_timing
    FROM information_schema.triggers
  `;
  console.log(JSON.stringify(triggers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

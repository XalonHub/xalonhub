const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client
// The client will automatically connect using the DATABASE_URL and DIRECT_URL
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        },
    },
});

module.exports = prisma;

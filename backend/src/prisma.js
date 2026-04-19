const { PrismaClient } = require('@prisma/client');

const isProduction = process.env.NODE_ENV === 'production';

// Log database connection status (without exposing credentials)
let dbHost = 'UNKNOWN';
try {
    if (process.env.DATABASE_URL) {
        dbHost = new URL(process.env.DATABASE_URL).host;
    }
} catch (e) {
    dbHost = 'INVALID_URL';
}

console.log(`[Database] Connecting to ${dbHost} [Env: ${process.env.NODE_ENV || 'development'}]`);

// Initialize Prisma Client
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        },
    },
    // Log queries in development only
    log: isProduction ? ['error'] : ['query', 'info', 'warn', 'error'],
});

module.exports = prisma;

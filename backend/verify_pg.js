const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        await client.connect();
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('User', 'PartnerProfile', 'ServiceCatalog', 'Client', 'Booking');
    `);
        console.log("Supabase Tables Confirmed:");
        console.table(res.rows);
    } catch (err) {
        console.error("Error connecting to Supabase:", err);
    } finally {
        await client.end();
    }
}
run();

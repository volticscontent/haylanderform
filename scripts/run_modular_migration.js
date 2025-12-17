const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
// Try .env if .env.local didn't work or just in case
require('dotenv').config({ path: '.env' });

console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.replace('localhost', '127.0.0.1'),
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration...');

    // 1. Create Tables
    const createTablesSql = fs.readFileSync(path.join(__dirname, '../docs/create_modular_tables.sql'), 'utf8');
    console.log('Executing create_modular_tables.sql...');
    await client.query(createTablesSql);
    console.log('Tables created successfully.');

    // 2. Migrate Data
    const migrateDataSql = fs.readFileSync(path.join(__dirname, '../docs/migrate_to_modular.sql'), 'utf8');
    console.log('Executing migrate_to_modular.sql...');
    await client.query(migrateDataSql);
    console.log('Data migrated successfully.');

  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

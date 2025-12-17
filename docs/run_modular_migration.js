/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded' : 'Not Loaded');
  if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is missing!');
      process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=disable') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    // ... rest of the code
    console.log('Connected.');
    
    fs.writeFileSync('migration_log.txt', 'Connected to database\n');

    // Read SQL files
    const createTablesSql = fs.readFileSync(path.join(__dirname, 'create_modular_tables.sql'), 'utf8');
    const migrateDataSql = fs.readFileSync(path.join(__dirname, 'migrate_to_modular.sql'), 'utf8');

    console.log('Creating modular tables...');
    fs.appendFileSync('migration_log.txt', 'Creating modular tables...\n');
    await client.query(createTablesSql);
    fs.appendFileSync('migration_log.txt', 'Modular tables created.\n');

    console.log('Migrating data...');
    fs.appendFileSync('migration_log.txt', 'Migrating data...\n');
    await client.query(migrateDataSql);
    fs.appendFileSync('migration_log.txt', 'Data migration completed.\n');

    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
    fs.appendFileSync('migration_log.txt', `Migration failed: ${err.message}\n${err.stack}\n`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' }); // Load env vars if needed, though next.js usually handles this differently. Assuming standard env var presence or I'll try to read .env

// If .env.local is not loaded automatically, we might need to load it manually.
// Let's assume the environment has the DATABASE_URL or we need to load it.
// Since I cannot easily rely on dotenv being installed/configured for standalone scripts in this environment without checking,
// I will try to read the .env.local file directly if process.env.DATABASE_URL is missing.

const fs = require('fs');
const path = require('path');

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8').trim();
      // Check if it starts with postgres:// directly or has DATABASE_URL=
      if (envConfig.startsWith('postgres://')) {
          connectionString = envConfig;
      } else {
          const match = envConfig.match(/DATABASE_URL=(.*)/);
          if (match && match[1]) {
            connectionString = match[1].trim();
          }
      }
    }
  } catch (e) {
    console.error("Error reading .env.local", e);
  }
}

if (!connectionString) {
    console.error("DATABASE_URL not found. Please ensure .env.local exists or DATABASE_URL is set.");
    process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
});

async function addColumn() {
  try {
    await client.connect();
    console.log("Connected to database...");
    
    // Check if column exists
    const checkRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'haylander' AND column_name = 'calculo_parcelamento';
    `);

    if (checkRes.rows.length > 0) {
        console.log("Column 'calculo_parcelamento' already exists.");
    } else {
        console.log("Adding column 'calculo_parcelamento'...");
        await client.query(`
          ALTER TABLE haylander
          ADD COLUMN calculo_parcelamento TEXT;
        `);
        console.log("Column added successfully.");
    }

  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

addColumn();

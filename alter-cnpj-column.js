const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8').trim();
      if (envConfig.startsWith('postgres://')) {
          connectionString = envConfig;
      } else {
          const match = envConfig.match(/DATABASE_URL=(.*)/);
          if (match && match[1]) {
            connectionString = match[1].trim();
          }
      }
      // Clean quotes
      if (connectionString) {
          connectionString = connectionString.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
      }
    }
  } catch (e) {
    console.error("Error reading .env", e);
  }
}

if (!connectionString) {
    console.error("DATABASE_URL not found.");
    process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to database.");
    
    // Alter column type
    const query = `ALTER TABLE haylander ALTER COLUMN cnpj TYPE TEXT;`;
    await client.query(query);
    console.log("Successfully changed 'cnpj' column type to TEXT.");
    
  } catch (err) {
    console.error('Error executing query', err);
  } finally {
    await client.end();
  }
}

run();

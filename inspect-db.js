const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  try {
    // Try reading .env
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

async function inspect() {
  try {
    await client.connect();
    console.log("Connected.");
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'haylander';
    `);
    console.log('Columns in haylander table:');
    res.rows.forEach(row => {
      console.log(`${row.column_name} (${row.data_type})`);
    });
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

inspect();

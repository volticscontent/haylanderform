
const { Client } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function checkSchemaRows() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    console.log('Querying information_schema.columns for senha_gov...');
    const res = await client.query(`
      SELECT 
        table_schema,
        table_name, 
        column_name, 
        ordinal_position
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND (table_name = 'haylander' OR table_name = 'mei_applications')
      AND column_name = 'senha_gov';
    `);
    
    console.table(res.rows);

  } catch (err) {
    console.error('Error checking schema:', err);
  } finally {
    await client.end();
  }
}

checkSchemaRows();

/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected to database');

    // Test connection with a simple select
    const res = await client.query('SELECT count(*) FROM haylander');
    console.log('Rows in haylander:', res.rows[0].count);

    const query = `
      ALTER TABLE haylander 
      ADD COLUMN IF NOT EXISTS data_ultima_consulta TIMESTAMP,
      ADD COLUMN IF NOT EXISTS procuracao_ativa BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS procuracao_validade TIMESTAMP;
    `;

    await client.query(query);
    console.log('Columns added successfully');
  } catch (err) {
    console.error('Error adding columns:', err);
  } finally {
    await client.end();
  }
}

run();


import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Add columns to haylander table
    await client.query(`
      ALTER TABLE haylander 
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS senha_gov TEXT;
    `);
    console.log('Added email and senha_gov to haylander');

    // Add columns to mei_applications table (email already exists, just senha_gov)
    await client.query(`
      ALTER TABLE mei_applications 
      ADD COLUMN IF NOT EXISTS senha_gov TEXT;
    `);
    console.log('Added senha_gov to mei_applications');

  } catch (error) {
    console.error('Error running migrations:', error);
  } finally {
    await client.end();
  }
}

main();

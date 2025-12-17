
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runSqlFile(filePath) {
  const client = await pool.connect();
  try {
    const fullPath = path.resolve(__dirname, '..', filePath);
    console.log(`Reading SQL file: ${fullPath}`);
    const sql = fs.readFileSync(fullPath, 'utf8');
    
    console.log('Executing SQL...');
    await client.query(sql);
    console.log('Success!');
  } catch (err) {
    console.error('Error executing SQL file:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('Running modularization scripts...');
    
    console.log('--- Creating Tables ---');
    await runSqlFile('docs/create_modular_tables.sql');
    
    console.log('--- Migrating Data ---');
    await runSqlFile('docs/migrate_to_modular.sql');
    
    console.log('All scripts executed successfully.');
  } catch (err) {
    console.error('Script execution failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

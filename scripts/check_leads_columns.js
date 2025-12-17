const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'leads'
    `);
    console.log(res.rows.map(r => r.column_name));
  } finally {
    client.release();
    pool.end();
  }
}

run();


import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function inspect() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'haylander';
    `);
    console.log("Columns in 'haylander':");
    res.rows.forEach(row => console.log(`${row.column_name} (${row.data_type})`));
  } catch (err) {
    console.error("Error inspecting table:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

inspect();

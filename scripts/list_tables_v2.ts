
import 'dotenv/config';
import pool from '../src/lib/db';

async function listTables() {
  try {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    const res = await pool.query(query);
    console.log('Tables:');
    res.rows.forEach(row => console.log(row.table_name));
  } catch (error) {
    console.error('Error querying schema:', error);
  } finally {
    await pool.end();
  }
}

listTables();

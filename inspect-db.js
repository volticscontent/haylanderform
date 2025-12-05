const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function inspect() {
  try {
    await client.connect();
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

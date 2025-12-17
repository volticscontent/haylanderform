/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function listTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('Tables:', res.rows.map(r => r.table_name));
    
    // Also count rows in new tables
    const tables = ['leads_empresarial', 'leads_qualificacao', 'leads_financeiro', 'leads_vendas', 'leads_atendimento'];
    for (const t of tables) {
        try {
            const countRes = await client.query(`SELECT COUNT(*) FROM ${t}`);
            console.log(`${t} count:`, countRes.rows[0].count);
        } catch (e) {
            console.log(`${t} does not exist or error:`, e.message);
        }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

listTables();

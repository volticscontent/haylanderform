const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const client = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await client.connect();
  const r = await client.query('SELECT cnpj, tipo_servico, status, created_at, source FROM consultas_serpro ORDER BY created_at DESC LIMIT 10');
  console.table(r.rows);
  await client.end();
}
main().catch(console.error);
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await client.connect();
  const cnpj = '23.950.473/0001-55'.replace(/\D/g, ''); // the one from previous test
  const { rows } = await client.query(
    `SELECT id, cnpj, tipo_servico, status, created_at, source
     FROM consultas_serpro
     WHERE REPLACE(cnpj, '.', '') = $1
        OR REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = $1
     ORDER BY created_at DESC LIMIT 20`,
    [cnpj]
  );
  console.log('Result from API query for', cnpj, ':', rows.length);
  await client.end();
}
main().catch(console.error);
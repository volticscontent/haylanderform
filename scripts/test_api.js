import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await client.connect();
  const cnps = ['23950473000155', '45723564000190'];
  for (const cnpj of cnps) {
      const { rows } = await client.query(
        `SELECT id, cnpj, tipo_servico, status, created_at, source
         FROM consultas_serpro
         WHERE REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = $1
         ORDER BY created_at DESC LIMIT 5`,
        [cnpj]
      );
      console.log('Result from API query for', cnpj, ':', rows.length, 'rows');
      if(rows.length > 0) console.log(rows);
  }
  await client.end();
}
main().catch(console.error);
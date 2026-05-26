import { Client } from 'pg';

async function checkDb(url, name) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const { rows } = await client.query('SELECT count(*) FROM leads');
    console.log(`[${name}] Leads count:`, rows[0].count);
    const res2 = await client.query('SELECT count(*) FROM consultas_serpro');
    console.log(`[${name}] Consultas count:`, res2.rows[0].count);
  } catch(e) {
    console.log(`[${name}] Error:`, e.message);
  } finally {
    await client.end();
  }
}

async function main() {
  const frontUrl = 'postgres://postgres:3ad3550763e84d5864a7@easypanel.landcriativa.com:9000/systembots?sslmode=disable';
  const backUrl = 'postgres://root:mG19276395$R@easy.tpsuk.shop:5432/n_db_pg?sslmode=disable';
  
  await checkDb(frontUrl, 'Frontend DB');
  await checkDb(backUrl, 'Backend DB');
}

main();
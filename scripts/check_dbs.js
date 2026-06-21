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
  // Credenciais NUNCA hardcoded. Defina no .env (que e gitignored):
  //   FRONTEND_DB_URL=postgres://user:pass@host:port/db
  //   BACKEND_DB_URL=postgres://user:pass@host:port/db
  const frontUrl = process.env.FRONTEND_DB_URL;
  const backUrl = process.env.BACKEND_DB_URL;

  if (!frontUrl || !backUrl) {
    console.error('Defina FRONTEND_DB_URL e BACKEND_DB_URL no ambiente antes de rodar este script.');
    process.exit(1);
  }

  await checkDb(frontUrl, 'Frontend DB');
  await checkDb(backUrl, 'Backend DB');
}

main();

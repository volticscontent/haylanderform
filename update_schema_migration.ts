import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  await client.connect();

  try {
    console.log('Adding missing columns to leads table...');
    
    // Add columns if they don't exist
    await client.query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS cartao_cnpj VARCHAR(50),
      ADD COLUMN IF NOT EXISTS pos_qualificacao BOOLEAN,
      ADD COLUMN IF NOT EXISTS servico_negociado VARCHAR(100),
      ADD COLUMN IF NOT EXISTS data_ultima_consulta TIMESTAMP,
      ADD COLUMN IF NOT EXISTS procuracao BOOLEAN;
    `);

    console.log('Columns added. Migrating data...');

    // Fetch data from haylander
    const res = await client.query('SELECT * FROM haylander');
    
    let updatedCount = 0;
    for (const row of res.rows) {
      // Normalize values
      const cartao_cnpj = row['cartão-cnpj'];
      const pos_qualificacao = row['pós_qualificação'];
      const servico_negociado = row['serviço_negociado'];
      const data_ultima_consulta = row['data_ultima_consulta'];
      const procuracao = row['procuração'];

      // Update leads table based on telefone (assuming unique)
      if (row.telefone) {
        await client.query(`
          UPDATE leads 
          SET 
            cartao_cnpj = $1,
            pos_qualificacao = $2,
            servico_negociado = $3,
            data_ultima_consulta = $4,
            procuracao = $5
          WHERE telefone = $6
        `, [
          cartao_cnpj,
          pos_qualificacao,
          servico_negociado,
          data_ultima_consulta,
          procuracao,
          row.telefone
        ]);
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} rows.`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();


import 'dotenv/config';
import pool from '../src/lib/db';

async function addAttendantColumns() {
  try {
    console.log('Adicionando colunas de atendimento na tabela leads...');
    
    const query = `
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS needs_attendant BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS attendant_requested_at TIMESTAMP;

      CREATE INDEX IF NOT EXISTS idx_leads_needs_attendant ON leads(needs_attendant);
    `;
    
    await pool.query(query);
    console.log('Colunas de atendimento adicionadas com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar colunas:', error);
  } finally {
    await pool.end();
  }
}

addAttendantColumns();

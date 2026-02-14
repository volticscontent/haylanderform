
import 'dotenv/config';
import pool from '../src/lib/db';

async function addSourceColumn() {
  try {
    console.log('Adicionando coluna "source" na tabela consultas_serpro...');
    
    const query = `
      ALTER TABLE consultas_serpro 
      ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'admin';

      CREATE INDEX IF NOT EXISTS idx_consultas_serpro_source ON consultas_serpro(source);
    `;
    
    await pool.query(query);
    console.log('Coluna "source" adicionada com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar coluna:', error);
  } finally {
    await pool.end();
  }
}

addSourceColumn();

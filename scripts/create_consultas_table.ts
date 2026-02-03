
import 'dotenv/config';
import pool from '../src/lib/db';

async function createTable() {
  try {
    console.log('Criando tabela consultas_serpro...');
    
    const query = `
      CREATE TABLE IF NOT EXISTS consultas_serpro (
          id SERIAL PRIMARY KEY,
          cnpj VARCHAR(20) NOT NULL,
          tipo_servico VARCHAR(50) NOT NULL,
          resultado JSONB,
          status INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_consultas_serpro_cnpj ON consultas_serpro(cnpj);
    `;
    
    await pool.query(query);
    console.log('Tabela consultas_serpro criada/verificada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
  } finally {
    await pool.end();
  }
}

createTable();

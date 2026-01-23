
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function init() {
  try {
    console.log('Criando tabela chat_history...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(50) NOT NULL,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_chat_history_phone ON chat_history(phone);
    `);
    console.log('✅ Tabela chat_history criada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
  } finally {
    await pool.end();
  }
}

init();

import 'dotenv/config';
import pool from '../lib/db';

async function addMissingColumns() {
    const client = await pool.connect();
    try {
        console.log('Adding missing seller columns...');
        await client.query('BEGIN');
        
        // leads_vendas
        await client.query(`ALTER TABLE leads_vendas ADD COLUMN IF NOT EXISTS servico_escolhido VARCHAR(255)`);
        await client.query(`ALTER TABLE leads_vendas ADD COLUMN IF NOT EXISTS reuniao_agendada BOOLEAN DEFAULT FALSE`);
        await client.query(`ALTER TABLE leads_vendas ADD COLUMN IF NOT EXISTS vendido BOOLEAN DEFAULT FALSE`);
        
        // leads_qualificacao
        await client.query(`ALTER TABLE leads_qualificacao ADD COLUMN IF NOT EXISTS confirmacao_qualificacao BOOLEAN DEFAULT FALSE`);

        console.log('Columns added successfully');
        await client.query('COMMIT');
    } catch (err) {
        console.error('Error adding columns', err);
        await client.query('ROLLBACK');
    } finally {
        client.release();
        process.exit(0);
    }
}

addMissingColumns();

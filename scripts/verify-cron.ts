import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    console.log('--- 1. Checking Database Connection ---');
    const res = await pool.query('SELECT NOW()');
    console.log('Connected at:', res.rows[0].now);

    console.log('\n--- 2. Checking Tables ---');
    const tableRes = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'disparos'
      );
    `);
    
    if (!tableRes.rows[0].exists) {
        console.log('Creating disparos table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS disparos (
                id SERIAL PRIMARY KEY,
                channel VARCHAR(50) NOT NULL,
                instance_name VARCHAR(100),
                body TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'draft',
                schedule_at TIMESTAMP,
                filters JSONB,
                stats JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
    } else {
        console.log('Disparos table exists.');
    }

    // Get a lead
    const leadRes = await pool.query('SELECT telefone, nome_completo FROM leads LIMIT 1');
    if (leadRes.rows.length === 0) {
        console.log('No leads found to test.');
        return;
    }
    const targetLead = leadRes.rows[0];
    console.log('Target Lead:', targetLead.telefone, targetLead.nome_completo);

    console.log('\n--- 3. Creating Test Disparo ---');
    // Create a disparo that matches this lead specifically
    const insertRes = await pool.query(`
      INSERT INTO disparos (channel, body, status, filters, instance_name, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id
    `, [
        'whatsapp',
        'Teste Cron Job: Olá {{nome_completo}}. Ignorar esta mensagem.',
        'pending',
        JSON.stringify({ phones: [targetLead.telefone] }), // Use explicit phone filter to be safe
        process.env.EVOLUTION_INSTANCE_NAME || 'teste'
    ]);
    
    const disparoId = insertRes.rows[0].id;
    console.log(`Created Disparo ID: ${disparoId} (Status: pending)`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();


/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedSettings() {
  const client = await pool.connect();
  try {
    console.log('Seeding system settings...');
    
    // Ensure table exists first (just in case the previous migration didn't run or I want to be safe)
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT,
        label VARCHAR(255),
        type VARCHAR(50) DEFAULT 'text',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const settings = [
      {
        key: 'video_ecac',
        value: 'https://pub-9bcc48f0ec304eabbad08c9e3dec23de.r2.dev/0915.mp4',
        label: 'Vídeo do e-CAC',
        type: 'media'
      },
      {
        key: 'apresentacao_comercial',
        value: 'https://pub-9bcc48f0ec304eabbad08c9e3dec23de.r2.dev/apc%20haylander.pdf',
        label: 'Apresentação Comercial',
        type: 'media'
      }
    ];

    for (const setting of settings) {
      await client.query(`
        INSERT INTO system_settings (key, value, label, type)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (key) DO UPDATE 
        SET value = EXCLUDED.value,
            label = EXCLUDED.label,
            type = EXCLUDED.type;
      `, [setting.key, setting.value, setting.label, setting.type]);
    }

    console.log('Settings seeded successfully.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedSettings();

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load env manually since dotenv might not be installed
const envPath = path.resolve(__dirname, '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const dbUrlLine = envConfig.split('\n').find(line => line.startsWith('DATABASE_URL=') || line.startsWith('postgres://'));
let connectionString = process.env.DATABASE_URL;

if (!connectionString && dbUrlLine) {
    // Handle "DATABASE_URL=..." or just the raw url if it's the only thing
    connectionString = dbUrlLine.startsWith('DATABASE_URL=') ? dbUrlLine.split('=')[1].trim() : dbUrlLine.trim();
} else if (!connectionString) {
    // Fallback to the raw content if it looks like a URL
    if (envConfig.trim().startsWith('postgres://')) {
        connectionString = envConfig.trim();
    }
}

console.log('Using connection string:', connectionString);

const client = new Client({
  connectionString: connectionString,
});

async function updateSchema() {
  try {
    await client.connect();
    console.log('Connected to database.');

    const queries = [
      `ALTER TABLE haylander ADD COLUMN IF NOT EXISTS "possui_sócio" BOOLEAN;`,
      `ALTER TABLE haylander ADD COLUMN IF NOT EXISTS valor_divida_municipal TEXT;`,
      `ALTER TABLE haylander ADD COLUMN IF NOT EXISTS valor_divida_estadual TEXT;`,
      `ALTER TABLE haylander ADD COLUMN IF NOT EXISTS valor_divida_federal TEXT;`,
      `ALTER TABLE haylander ADD COLUMN IF NOT EXISTS valor_divida_ativa TEXT;`,
      `ALTER TABLE haylander ADD COLUMN IF NOT EXISTS observacoes TEXT;`,
      `ALTER TABLE haylander ADD COLUMN IF NOT EXISTS envio_disparo TEXT;`,
      `ALTER TABLE haylander ADD COLUMN IF NOT EXISTS data_controle_24h TIMESTAMP;`,
      `ALTER TABLE haylander ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP;`
    ];

    for (const query of queries) {
      console.log(`Executing: ${query}`);
      await client.query(query);
    }

    console.log('Schema updated successfully.');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    await client.end();
  }
}

updateSchema();

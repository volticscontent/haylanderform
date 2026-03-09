const { Client } = require('pg');

async function checkEvolutionChats() {
    const client = new Client({
        connectionString: 'postgres://postgres:3ad3550763e84d5864a7@easypanel.landcriativa.com:9000/systembots?sslmode=disable'
    });

    try {
        await client.connect();

        // Check Chat table
        const resChats = await client.query('SELECT * FROM "Chat" LIMIT 1');
        console.log('--- Estrutura da Tabela Chat ---');
        console.log(JSON.stringify(resChats.rows, null, 2));

        // Check columns of Chat table
        const resColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Chat'
    `);
        console.log('--- Colunas da Tabela Chat ---');
        console.log(JSON.stringify(resColumns.rows, null, 2));

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await client.end();
    }
}

checkEvolutionChats();

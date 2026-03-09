const { Client } = require('pg');

async function checkEvolutionMessages() {
    const client = new Client({
        connectionString: 'postgres://postgres:3ad3550763e84d5864a7@easypanel.landcriativa.com:9000/systembots?sslmode=disable'
    });

    try {
        await client.connect();

        // Check Columns of Message table
        const resColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Message'
    `);
        console.log('--- Colunas da Tabela Message ---');
        console.log(JSON.stringify(resColumns.rows, null, 2));

        const resMsg = await client.query('SELECT * FROM "Message" LIMIT 1');
        console.log('--- Amostra de Message ---');
        console.log(JSON.stringify(resMsg.rows, null, 2));

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await client.end();
    }
}

checkEvolutionMessages();

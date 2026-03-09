const { Client } = require('pg');

async function checkEvolutionContacts() {
    const client = new Client({
        connectionString: 'postgres://postgres:3ad3550763e84d5864a7@easypanel.landcriativa.com:9000/systembots?sslmode=disable'
    });

    try {
        await client.connect();

        // First, list all tables to see what we're working with in Evolution v2 Prisma
        const resTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        const tables = resTables.rows.map(r => r.table_name);
        console.log('--- Tabelas Encontradas no Banco da Evolution ---');
        console.log(tables.join(', '));
        console.log('\n');

        // If 'Contact' or 'Contact' table exists, let's query it
        if (tables.includes('Contact')) {
            const resContacts = await client.query('SELECT * FROM "Contact" LIMIT 5');
            console.log('--- Amostra de 5 Contatos Salvos ---');
            console.log(JSON.stringify(resContacts.rows, null, 2));
        } else if (tables.includes('contact')) {
            const resContacts = await client.query('SELECT * FROM contact LIMIT 5');
            console.log('--- Amostra de 5 Contatos Salvos ---');
            console.log(JSON.stringify(resContacts.rows, null, 2));
        } else {
            console.log('Tabela Contact não encontrada com esse nome exato.');
        }

    } catch (err) {
        console.error('Erro de conexão ou consulta:', err);
    } finally {
        await client.end();
    }
}

checkEvolutionContacts();

const { Client } = require('pg');

async function testSQL() {
    const client = new Client({
        connectionString: 'postgres://postgres:3ad3550763e84d5864a7@easypanel.landcriativa.com:9000/systembots?sslmode=disable'
    });

    try {
        await client.connect();

        const instanceRes = await client.query(`SELECT id FROM "Instance" WHERE name = 'teste' LIMIT 1`);
        const instanceId = instanceRes.rows[0]?.id;

        const chatsQuery = await client.query(`
          SELECT 
            c."remoteJid" as id, 
            c."remoteJid" as "remoteJid",
            c."pushName", 
            ch."name",
            ch."unreadMessages" as "unreadCount"
          FROM "Contact" c
          INNER JOIN "Chat" ch ON c."remoteJid" = ch."remoteJid" AND c."instanceId" = ch."instanceId"
          WHERE c."instanceId" = $1
          LIMIT 10
        `, [instanceId]);

        console.log("SQL Results (10 first):");
        console.log(JSON.stringify(chatsQuery.rows, null, 2));

    } catch (err) {
        console.error('Erro:', err);
    } finally {
        await client.end();
    }
}

testSQL();

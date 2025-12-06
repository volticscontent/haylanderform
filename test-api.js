const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load env manually
const envPath = path.resolve(__dirname, '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const dbUrlLine = envConfig.split('\n').find(line => line.startsWith('DATABASE_URL=') || line.startsWith('postgres://'));
let connectionString = process.env.DATABASE_URL;

if (!connectionString && dbUrlLine) {
    connectionString = dbUrlLine.startsWith('DATABASE_URL=') ? dbUrlLine.split('=')[1].trim() : dbUrlLine.trim();
} else if (!connectionString) {
    if (envConfig.trim().startsWith('postgres://')) {
        connectionString = envConfig.trim();
    }
}

if (connectionString) {
    connectionString = connectionString.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
}

console.log('Using connection string:', connectionString);

const client = new Client({
  connectionString: connectionString,
});

async function simulatePut() {
    const phone = '553182354127';
    // Payload from user
    const body = {
        cnpj: "313213123123123",
        tipo_negocio: "MEI",
        possui_socio: "Sim",
        calculo_parcelamento: "12x de R$ 8.333,33",
        faturamento_mensal: "Abaixo de R$10.000",
        observacoes: "Regularizacao\nTempo da dívida: 2 anos",
        teria_interesse: "Sim",
        tipo_divida: "Ajuizada",
        valor_divida_municipal: "100000"
    };

    const {
        cnpj,
        tipo_negocio,
        possui_socio,
        tipo_divida,
        valor_divida_municipal,
        valor_divida_estadual,
        valor_divida_federal,
        valor_divida_ativa,
        faturamento_mensal,
        observacoes,
        teria_interesse,
        calculo_parcelamento,
    } = body;

    try {
        await client.connect();
        console.log('Connected.');

        const updateQuery = `
          UPDATE haylander
          SET 
            cnpj = $1,
            "tipo_negócio" = $2,
            "possui_sócio" = $3,
            tipo_divida = $4,
            valor_divida_municipal = COALESCE($5, valor_divida_municipal),
            valor_divida_estadual = COALESCE($6, valor_divida_estadual),
            valor_divida_federal = COALESCE($7, valor_divida_federal),
            valor_divida_ativa = COALESCE($8, valor_divida_ativa),
            faturamento_mensal = $9,
            observacoes = $10,
            "teria_interesse?" = $11,
            calculo_parcelamento = $12,
            envio_disparo = 'a1',
            data_controle_24h = NOW() + INTERVAL '24 hours',
            atualizado_em = NOW()
          WHERE telefone = $13
          RETURNING *
        `;

        const values = [
          cnpj || null,
          tipo_negocio || null,
          possui_socio === "Sim", // Boolean
          tipo_divida || null,
          valor_divida_municipal || null,
          valor_divida_estadual || null, // undefined -> null
          valor_divida_federal || null, // undefined -> null
          valor_divida_ativa || null, // undefined -> null
          faturamento_mensal || null,
          observacoes || null,
          teria_interesse || null,
          calculo_parcelamento || null,
          phone,
        ];

        console.log('Executing query with values:', values);

        const res = await client.query(updateQuery, values);
        
        console.log('Result row count:', res.rowCount);
        if (res.rows.length > 0) {
            console.log('Updated row:', res.rows[0]);
        } else {
            console.log('No row updated (user not found?)');
        }

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

simulatePut();

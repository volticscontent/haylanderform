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

const client = new Client({
  connectionString: connectionString,
});

async function verify() {
    const phone = '553182354127';
    try {
        await client.connect();
        console.log('Connected.');

        const res = await client.query('SELECT * FROM haylander WHERE telefone = $1', [phone]);
        
        if (res.rows.length > 0) {
            const user = res.rows[0];
            console.log('User found:');
            console.log('CNPJ:', user.cnpj);
            console.log('Calculo Parcelamento:', user.calculo_parcelamento);
            
            // Validations
            const cnpjValid = user.cnpj === "313213123123123";
            const calcValid = user.calculo_parcelamento === "12x de R$ 8.333,33";
            
            if (cnpjValid && calcValid) {
                console.log('SUCCESS: Data verification passed!');
            } else {
                console.log('FAILURE: Data mismatch.');
                if (!cnpjValid) console.log('Expected CNPJ: 313213123123123, Got:', user.cnpj);
                if (!calcValid) console.log('Expected Calc: 12x de R$ 8.333,33, Got:', user.calculo_parcelamento);
            }
        } else {
            console.log('User not found.');
        }

    } catch (err) {
        console.error('Error executing query', err);
    } finally {
        await client.end();
    }
}

verify();
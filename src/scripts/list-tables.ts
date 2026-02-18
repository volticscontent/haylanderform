import 'dotenv/config';
import pool from '../lib/db';

async function listTables() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables:', res.rows.map(r => r.table_name));

        // Check columns of 'services' if it exists
        if (res.rows.find(r => r.table_name === 'services')) {
            const cols = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'services'
            `);
            console.log('Services Columns:', cols.rows);
        }

        // Check columns of 'system_settings' if it exists
        if (res.rows.find(r => r.table_name === 'system_settings')) {
             const cols = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'system_settings'
            `);
            console.log('System Settings Columns:', cols.rows);
            
            // Check content of system_settings related to R2 or assets
            const settings = await client.query(`SELECT * FROM system_settings WHERE key LIKE '%r2%' OR key LIKE '%asset%'`);
            console.log('System Settings (R2/Assets):', settings.rows);
        }

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        process.exit(0); // Ensure process exits
    }
}

listTables();
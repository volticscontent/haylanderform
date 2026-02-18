import 'dotenv/config';
import pool from '../lib/db';

async function checkLeadsTable() {
    const client = await pool.connect();
    try {
        console.log('Checking leads table...');
        
        const cols = await client.query(`
            SELECT column_name, data_type, character_maximum_length, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'leads'
        `);
        console.table(cols.rows);

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        process.exit(0);
    }
}

checkLeadsTable();

import 'dotenv/config';
import pool from '../lib/db';

async function checkMedia() {
    const client = await pool.connect();
    try {
        const cols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Media'
        `);
        console.log('Media Columns:', cols.rows);
        
        const rows = await client.query(`SELECT * FROM "Media" LIMIT 5`);
        console.log('Media Rows:', rows.rows);

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        process.exit(0);
    }
}

checkMedia();
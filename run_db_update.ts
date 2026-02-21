import { config } from 'dotenv';
config({ path: '.env' });
import pg from 'pg';
import fs from 'fs';

async function run() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
        const sql = fs.readFileSync('./update_db_bots.sql', 'utf8');
        await pool.query(sql);
        console.log('DB updated successfully!');
    } catch (err) {
        console.error('Error updating DB:', err);
    } finally {
        process.exit(0);
    }
}

run();

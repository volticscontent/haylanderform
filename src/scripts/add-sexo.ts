import 'dotenv/config';
import pool from './src/lib/db';

async function mapSexo() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS sexo VARCHAR(15);`);
        await client.query('COMMIT');
        console.log("Column 'sexo' added successfully to 'leads' table.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error adding column:", e);
    } finally {
        client.release();
        process.exit(0);
    }
}

mapSexo();

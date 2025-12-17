import pool from './src/lib/db';
import * as dotenv from 'dotenv';

dotenv.config();

async function inspectSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type, udt_name 
            FROM information_schema.columns 
            WHERE table_name = 'haylander';
        `);
        console.log("Schema da tabela 'haylander':");
        console.table(res.rows);
    } catch (e) {
        console.error("Erro ao inspecionar schema:", e);
    } finally {
        await pool.end();
    }
}

inspectSchema();

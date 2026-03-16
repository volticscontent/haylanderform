import 'dotenv/config';
import pool from '../lib/db';

async function checkForeignKeys() {
    const client = await pool.connect();
    try {
        const query = `
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.update_rule,
                rc.delete_rule
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
                JOIN information_schema.referential_constraints AS rc
                  ON rc.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name LIKE 'leads_%';
        `;
        const res = await client.query(query);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        process.exit(0);
    }
}

checkForeignKeys();

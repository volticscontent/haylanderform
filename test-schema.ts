import 'dotenv/config';
import pool from './src/lib/db';

async function test() {
    try {
        const res = await pool.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'leads_qualificacao';");
        console.table(res.rows);
        
        const chk = await pool.query("SELECT conname, pg_get_constraintdef(c.oid) AS constraint_def FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace WHERE conrelid = 'leads_qualificacao'::regclass;");
        console.table(chk.rows);

        // Also check if 'sexo' exists in 'leads'
        const resLeads = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'sexo';");
        console.log("Sexo column in leads:", resLeads.rows);

    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}

test();

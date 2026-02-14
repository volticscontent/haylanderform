
import 'dotenv/config';
import pool from '../src/lib/db';

async function debugConsultations() {
  try {
    console.log('--- Debugging Consultations ---');
    
    // 1. List latest 5 consultations
    const consultations = await pool.query(`
      SELECT id, cnpj, tipo_servico, created_at 
      FROM consultas_serpro 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('Latest 5 consultations:', consultations.rows);

    if (consultations.rows.length === 0) {
      console.log('No consultations found.');
      return;
    }

    // 2. Pick a CNPJ from the consultations
    const targetCnpj = consultations.rows[0].cnpj;
    console.log(`\nChecking CNPJ: ${targetCnpj}`);

    // 3. List all CNPJs in leads_empresarial to see format
    console.log('\nChecking leads_empresarial content...');
    const allLeads = await pool.query(`
      SELECT lead_id, cnpj FROM leads_empresarial WHERE cnpj IS NOT NULL LIMIT 10
    `);
    console.log('Sample CNPJs in leads_empresarial:', allLeads.rows);

    // 4. Try to find the specific CNPJ with cleaner logic
    // We want to match if the digits are the same
    const leads = await pool.query(`
      SELECT l.id, l.nome_completo, le.cnpj 
      FROM leads l
      JOIN leads_empresarial le ON l.id = le.lead_id
      WHERE regexp_replace(le.cnpj, '\\D', '', 'g') = $1
    `, [targetCnpj]);
    
    console.log(`Leads matching ${targetCnpj} (ignoring format):`, leads.rows);

    // 4. Simulate the getConsultationsByCnpj logic
    const cleanCnpj = targetCnpj.replace(/\D/g, '');
    const query = `
        SELECT 
            id,
            cnpj,
            tipo_servico,
            resultado,
            status,
            created_at
        FROM consultas_serpro
        WHERE cnpj = $1
        ORDER BY created_at DESC
    `;
    const res = await pool.query(query, [cleanCnpj]);
    console.log(`\nSimulated getConsultationsByCnpj('${targetCnpj}') result count:`, res.rowCount);
    
  } catch (error) {
    console.error('Error debugging:', error);
  } finally {
    // End the pool to allow script to exit
    // Note: pool.end() might hang if other connections are open, but for a script it's usually fine
    // Or just process.exit()
    process.exit(0);
  }
}

debugConsultations();

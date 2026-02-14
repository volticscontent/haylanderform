
import 'dotenv/config';
import { getConsultationsByCnpj } from '../src/app/admin/atendimento/actions';
import pool from '../src/lib/db';

async function testParams() {
    console.log('--- Testing getConsultationsByCnpj ---');
    
    // 1. Get a real CNPJ from DB
    const res = await pool.query('SELECT cnpj FROM consultas_serpro ORDER BY created_at DESC LIMIT 1');
    if (res.rowCount === 0) {
        console.log('No consultations found in DB to test with.');
        return;
    }
    
    const realCnpj = res.rows[0].cnpj;
    console.log(`Found real CNPJ in DB: "${realCnpj}"`);
    
    // 2. Test with clean CNPJ
    console.log(`\nTesting with clean CNPJ: "${realCnpj}"`);
    const result1 = await getConsultationsByCnpj(realCnpj);
    console.log('Result 1 success:', result1.success);
    console.log('Result 1 count:', result1.data?.length);
    
    // 3. Test with formatted CNPJ (simulating what LeadSheet might send)
    // Assuming realCnpj is 14 digits, let's format it vaguely
    if (realCnpj.length === 14) {
        const formatted = `${realCnpj.slice(0,2)}.${realCnpj.slice(2,5)}.${realCnpj.slice(5,8)}/${realCnpj.slice(8,12)}-${realCnpj.slice(12)}`;
        console.log(`\nTesting with formatted CNPJ: "${formatted}"`);
        const result2 = await getConsultationsByCnpj(formatted);
        console.log('Result 2 success:', result2.success);
        console.log('Result 2 count:', result2.data?.length);
    }
    
    process.exit(0);
}

testParams();

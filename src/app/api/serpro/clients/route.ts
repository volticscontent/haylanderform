import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Fetch clients sorted by last consultation date
    const query = `
      SELECT 
        l.id, 
        l.nome_completo as nome, 
        le.cnpj, 
        la.data_ultima_consulta, 
        lv.procuracao_ativa, 
        lv.procuracao_validade 
      FROM leads l
      LEFT JOIN leads_empresarial le ON l.id = le.lead_id
      LEFT JOIN leads_atendimento la ON l.id = la.lead_id
      LEFT JOIN leads_vendas lv ON l.id = lv.lead_id
      WHERE la.data_ultima_consulta IS NOT NULL 
      ORDER BY la.data_ultima_consulta DESC 
      LIMIT 10
    `;
    
    const result = await client.query(query);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching serpro clients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await client.end();
  }
}

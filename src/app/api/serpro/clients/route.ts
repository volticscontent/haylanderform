import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/dashboard-auth';
import { Client } from 'pg';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  if (!await verifyAdminSession(cookieStore.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) return NextResponse.json([], { status: 200 });

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();

    // Últimas 20 consultas distintas por CNPJ, com dados do lead
    const { rows } = await client.query(`
      SELECT DISTINCT ON (cs.cnpj)
        l.id,
        COALESCE(l.nome_completo, le.razao_social, cs.cnpj) AS nome,
        cs.cnpj,
        l.telefone,
        l.email,
        cs.created_at AS data_ultima_consulta,
        COALESCE(lv.procuracao_ativa, FALSE) AS procuracao_ativa,
        lv.procuracao_validade
      FROM consultas_serpro cs
      LEFT JOIN leads_empresarial le ON REPLACE(REPLACE(REPLACE(le.cnpj,'.',''),'/',''),'-','') = REPLACE(REPLACE(REPLACE(cs.cnpj,'.',''),'/',''),'-','')
      LEFT JOIN leads l ON l.id = le.lead_id
      LEFT JOIN leads_vendas lv ON lv.lead_id = l.id
      ORDER BY cs.cnpj, cs.created_at DESC
      LIMIT 20
    `);

    return NextResponse.json(rows);
  } catch (e) {
    console.error('serpro/clients DB error:', e);
    return NextResponse.json([]);
  } finally {
    await client.end();
  }
}

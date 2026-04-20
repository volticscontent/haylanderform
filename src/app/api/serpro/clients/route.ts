import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/dashboard-auth';
import { Client } from 'pg';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  if (!await verifyAdminSession(cookieStore.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) return NextResponse.json([]);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const { rows } = await client.query(`
      SELECT
        l.id,
        COALESCE(l.nome_completo, le.razao_social, cs.cnpj) AS nome,
        cs.cnpj,
        l.telefone,
        l.email,
        MAX(cs.created_at) AS data_ultima_consulta,
        COALESCE(MAX(lv.procuracao_ativa::int)::boolean, FALSE) AS procuracao_ativa,
        MAX(lv.procuracao_validade::text)::date AS procuracao_validade
      FROM consultas_serpro cs
      LEFT JOIN leads_empresarial le ON le.cnpj = cs.cnpj
      LEFT JOIN leads l ON l.id = le.lead_id
      LEFT JOIN leads_vendas lv ON lv.lead_id = l.id
      GROUP BY l.id, l.nome_completo, le.razao_social, cs.cnpj, l.telefone, l.email
      ORDER BY MAX(cs.created_at) DESC
      LIMIT 20
    `);
    return NextResponse.json(rows);
  } catch (e) {
    console.error('serpro/clients error:', e);
    return NextResponse.json([]);
  } finally {
    await client.end();
  }
}

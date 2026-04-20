import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/dashboard-auth';
import { Client } from 'pg';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  if (!await verifyAdminSession(cookieStore.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const phone = new URL(req.url).searchParams.get('phone');
  if (!phone) return NextResponse.json({ error: 'phone obrigatório' }, { status: 400 });

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT l.telefone, l.nome_completo,
              le.razao_social, le.cnpj,
              COALESCE(lv.servico_negociado, lv.servico_escolhido) AS servico,
              lv.data_reuniao, lv.status_atendimento
       FROM leads l
       LEFT JOIN leads_empresarial le ON l.id = le.lead_id
       LEFT JOIN leads_vendas lv ON l.id = lv.lead_id
       WHERE l.telefone = $1 LIMIT 1`,
      [phone]
    );
    return NextResponse.json({ lead: rows[0] ?? null });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    await client.end();
  }
}

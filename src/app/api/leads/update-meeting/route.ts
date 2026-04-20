import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/dashboard-auth';
import { Client } from 'pg';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (!await verifyAdminSession(cookieStore.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const { phone, data_reuniao } = await req.json();
  if (!phone || !data_reuniao) return NextResponse.json({ error: 'phone e data_reuniao obrigatórios' }, { status: 400 });

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query(
      `UPDATE leads_vendas lv
       SET data_reuniao = $1, reuniao_agendada = TRUE, updated_at = NOW()
       FROM leads l
       WHERE lv.lead_id = l.id AND l.telefone = $2`,
      [data_reuniao, phone]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    await client.end();
  }
}

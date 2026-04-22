import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/dashboard-auth';
import { Client } from 'pg';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  if (!await verifyAdminSession(cookieStore.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const cnpj = searchParams.get('cnpj')?.replace(/\D/g, '');
  if (!cnpj) return NextResponse.json({ error: 'CNPJ obrigatório' }, { status: 400 });

  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL ausente' }, { status: 500 });
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const { rows } = await client.query(
      `SELECT id, cnpj, tipo_servico, status, created_at, resultado, source
       FROM consultas_serpro
       WHERE REPLACE(cnpj, '.', '') = $1
          OR REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = $1
       ORDER BY created_at DESC LIMIT 20`,
      [cnpj]
    );
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    await client.end();
  }
}

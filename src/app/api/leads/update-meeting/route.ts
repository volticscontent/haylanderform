import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/dashboard-auth';
import { backendPut } from '@/lib/backend-proxy';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (!await verifyAdminSession(cookieStore.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const { phone, data_reuniao } = await req.json();
  if (!phone || !data_reuniao) return NextResponse.json({ error: 'phone e data_reuniao obrigatórios' }, { status: 400 });

  try {
    const res = await backendPut(`/api/leads/user/${encodeURIComponent(phone)}`, { data_reuniao });
    if (!res.ok) return NextResponse.json({ error: `Backend ${res.status}` }, { status: res.status });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

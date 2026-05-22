import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/dashboard-auth';
import { backendGet } from '@/lib/backend-proxy';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  if (!await verifyAdminSession(cookieStore.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const phone = new URL(req.url).searchParams.get('phone');
  if (!phone) return NextResponse.json({ error: 'phone obrigatório' }, { status: 400 });

  try {
    const res = await backendGet(`/api/leads/user/${encodeURIComponent(phone)}`);
    if (res.status === 404) return NextResponse.json({ lead: null });
    if (!res.ok) return NextResponse.json({ error: `Backend ${res.status}` }, { status: res.status });
    const lead = await res.json();
    return NextResponse.json({ lead });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/dashboard-auth';
import { backendGet } from '@/lib/backend-proxy';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  if (!await verifyAdminSession(cookieStore.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source') || undefined;
    const params = new URLSearchParams();
    if (source) params.set('source', source);

    const res = await backendGet('/api/serpro/clients', params);
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error('serpro/clients proxy error:', e);
    return NextResponse.json([]);
  }
}


import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/dashboard-auth';
import { backendPut } from '@/lib/backend-proxy';

export async function PUT(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const cookieStore = await cookies();
  if (!await verifyAdminSession(cookieStore.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  try {
    const { leadId } = await params;
    const body = await req.json();
    const res = await backendPut(`/api/serpro/procuracao/${leadId}`, body);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

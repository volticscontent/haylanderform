import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/dashboard-auth';
import { backendGet } from '@/lib/backend-proxy';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get('admin_session')?.value;
  
  if (!await verifyAdminSession(sessionValue)) {
    // Se a sessão for inválida, retorna 401 para o frontend lidar
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const cnpj = searchParams.get('cnpj');
    if (!cnpj) return NextResponse.json({ error: 'CNPJ obrigatório' }, { status: 400 });

    const params = new URLSearchParams();
    params.set('cnpj', cnpj.replace(/\D/g, ''));

    const res = await backendGet('/api/serpro/history', params);
    if (!res.ok) {
        throw new Error('Falha ao buscar histórico no backend');
    }
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error('serpro/history proxy error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

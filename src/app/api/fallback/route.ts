import { NextResponse } from 'next/server';
import { backendPost } from '@/lib/backend-proxy';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization') || '';
    const res = await backendPost('/api/fallback', body, authHeader ? { authorization: authHeader } : undefined);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

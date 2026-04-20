import { NextResponse } from 'next/server';
import { backendPost } from '@/lib/backend-proxy';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await backendPost('/api/disparos/create', body);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

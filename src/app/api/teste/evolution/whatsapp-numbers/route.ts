import { NextResponse } from 'next/server';
import { backendGet } from '@/lib/backend-proxy';

export async function POST(req: Request) {
  try {
    const body = await req.json() as { numbers?: unknown[] };
    const numbers = Array.isArray(body?.numbers)
      ? body.numbers.filter((n): n is string => typeof n === 'string')
      : [];
    if (numbers.length === 0) return NextResponse.json({ error: 'numbers deve ser um array de strings' }, { status: 400 });

    const params = new URLSearchParams({ numbers: numbers.join(',') });
    const res = await backendGet('/api/whatsapp/check-numbers', params);
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

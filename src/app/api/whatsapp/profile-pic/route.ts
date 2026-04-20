import { NextResponse } from 'next/server';
import { backendPost } from '@/lib/backend-proxy';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await backendPost('/api/whatsapp/profile-pic', body);
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json({ url: null });
  }
}

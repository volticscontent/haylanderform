import { NextResponse } from 'next/server';
import { backendGet } from '@/lib/backend-proxy';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const res = await backendGet('/api/leads/unique-values', searchParams);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

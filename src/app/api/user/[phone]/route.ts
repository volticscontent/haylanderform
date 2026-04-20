import { NextResponse } from 'next/server';
import { backendGet, backendPut } from '@/lib/backend-proxy';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ phone: string }> },
) {
  const { phone } = await params;
  try {
    const res = await backendGet(`/api/leads/user/${encodeURIComponent(phone)}`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ phone: string }> },
) {
  const { phone } = await params;
  try {
    const body = await request.json();
    const res = await backendPut(`/api/leads/user/${encodeURIComponent(phone)}`, body);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

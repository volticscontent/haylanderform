import { NextResponse } from 'next/server';
import { backendPost } from '@/lib/backend-proxy';

export async function POST() {
  try {
    const res = await backendPost('/api/whatsapp/sync-contacts', {});
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

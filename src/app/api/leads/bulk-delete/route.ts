import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { backendPost } from '@/lib/backend-proxy';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await backendPost('/api/leads/bulk-delete', body);
    const data = await res.json();
    if (res.ok) revalidatePath('');
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

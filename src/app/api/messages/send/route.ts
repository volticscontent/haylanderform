import { NextRequest, NextResponse } from 'next/server';
import { backendPost } from '@/lib/backend-proxy';

export async function GET() {
  return NextResponse.json({ status: 'online', method: 'GET' });
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = req.headers.get('x-api-key') || '';
    const res = await backendPost('/api/messages/send', body);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}

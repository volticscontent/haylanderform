import { NextResponse } from 'next/server'
import { checkWhatsAppNumbers } from '@/lib/evolution'

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json()

    const numbers =
      typeof body === 'object' &&
      body !== null &&
      'numbers' in body &&
      Array.isArray((body as { numbers?: unknown }).numbers)
        ? ((body as { numbers: unknown[] }).numbers.filter((n) => typeof n === 'string') as string[])
        : []

    if (numbers.length === 0) {
      return NextResponse.json({ error: 'numbers deve ser um array de strings' }, { status: 400 })
    }

    const data = await checkWhatsAppNumbers(numbers)
    return NextResponse.json({ success: true, data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

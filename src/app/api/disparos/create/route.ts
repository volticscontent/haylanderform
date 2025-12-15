import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // validate basic payload
    if (!body || !body.channel || !body.body || !body.filters) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const id = `DISP-${Date.now()}`

    // TODO: Integrar com motor de disparo (WhatsApp/SMS/E-mail) e persistir no banco
    // Por agora, ecoa o payload de volta para confirmar wiring

    return NextResponse.json({ id, received: body })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
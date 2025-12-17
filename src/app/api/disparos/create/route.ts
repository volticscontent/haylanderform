
import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // validate basic payload
    if (!body || !body.channel || !body.body || !body.filters) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    // Insert into database
    const query = `
      INSERT INTO disparos (channel, body, filters, schedule_at, status, instance_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at, status
    `
    
    const values = [
      body.channel,
      body.body,
      JSON.stringify(body.filters),
      body.schedule_at ? new Date(body.schedule_at) : null,
      body.status || 'pending',
      body.instance_name || null
    ]

    const result = await pool.query(query, values)
    const disparo = result.rows[0]

    // If no schedule_at or it's in the past, we could trigger processing immediately
    // For now, let's just return the queued status. The 'process' endpoint will handle it.
    // Or we can call the processing logic asynchronously here if it's immediate.
    
    // If user wants immediate send:
    if (!body.schedule_at || new Date(body.schedule_at) <= new Date()) {
       // We can optionally trigger processing here, but for reliability, better to have a separate runner.
       // However, to satisfy "programar os disparos", just saving it is 'scheduling'.
    }

    return NextResponse.json({ 
      id: disparo.id, 
      status: disparo.status,
      created_at: disparo.created_at,
      message: 'Disparo agendado com sucesso.'
    })
    
  } catch (err: unknown) {
    console.error('Erro ao criar disparo:', err)
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

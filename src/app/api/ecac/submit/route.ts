
import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome_completo, telefone, email, senha_gov } = body.form;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database connection not configured' }, { status: 500 });
    }

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    // Check if user exists
    const checkRes = await client.query('SELECT id FROM haylander WHERE telefone = $1', [telefone]);

    if (checkRes.rows.length > 0) {
      // Update
      await client.query(
        `UPDATE haylander SET nome_completo = $1, email = $2, senha_gov = $3, atualizado_em = NOW() WHERE telefone = $4`,
        [nome_completo, email, senha_gov, telefone]
      );
    } else {
      // Insert
      await client.query(
        `INSERT INTO haylander (nome_completo, telefone, email, senha_gov, created_at) VALUES ($1, $2, $3, $4, NOW())`,
        [nome_completo, telefone, email, senha_gov]
      );
    }

    await client.end();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('ECAC submit error:', error);
    return NextResponse.json({ error: 'Erro ao salvar dados' }, { status: 500 });
  }
}

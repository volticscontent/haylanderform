import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cnpj = searchParams.get('cnpj');

    if (!cnpj) {
      return NextResponse.json({ error: 'CNPJ is required' }, { status: 400 });
    }

    const cleanCnpj = cnpj.replace(/\D/g, '');

    const query = `
      SELECT 
        id,
        tipo_servico,
        resultado,
        status,
        source,
        created_at
      FROM consultas_serpro
      WHERE cnpj = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [cleanCnpj]);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching consultation history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

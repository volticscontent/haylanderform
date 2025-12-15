import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { consultarServico, SERVICE_CONFIG } from '@/lib/serpro';

async function updateClientData(cnpj: string) {
  if (!process.env.DATABASE_URL) return;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const cnpjClean = cnpj.replace(/\D/g, '');
    
    // Tenta encontrar por CNPJ formatado ou limpo
    const check = await client.query(
      'SELECT id FROM haylander WHERE REPLACE(REPLACE(REPLACE(cnpj, \'.\', \'\'), \'/\', \'\'), \'-\', \'\') = $1',
      [cnpjClean]
    );

    if (check.rows.length > 0) {
      await client.query(`
        UPDATE haylander 
        SET data_ultima_consulta = NOW()
        WHERE id = $1
      `, [check.rows[0].id]);
    }
  } catch (e) {
    console.error('Failed to update client DB:', e);
  } finally {
    await client.end();
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cnpj, service, ano, mes, numeroRecibo, codigoReceita } = body as { 
      cnpj?: string; 
      service?: keyof typeof SERVICE_CONFIG; 
      ano?: string;
      mes?: string;
      numeroRecibo?: string;
      codigoReceita?: string;
    };

    if (!cnpj) {
      return NextResponse.json({ error: 'CNPJ é obrigatório' }, { status: 400 });
    }

    const target = service || 'CCMEI_DADOS';
    const options = { ano, mes, numeroRecibo, codigoReceita };
    
    const result = await consultarServico(target, cnpj, options);

    // Update client data in background (don't await to avoid slowing response)
    updateClientData(cnpj).catch(console.error);

    if (target === 'CCMEI_DADOS' && result && typeof result === 'object') {
      const r = result as Record<string, unknown>;
      const mensagensRaw = (r.mensagens as unknown) ?? [];
      const mensagens: Array<{ codigo?: string; texto?: string }> = Array.isArray(mensagensRaw) ? mensagensRaw as Array<{ codigo?: string; texto?: string }> : [];
      const hasNaoMei = mensagens.some(m => String(m.texto || '').toLowerCase().includes('não possui mais a condição de mei'))
        || mensagens.some(m => String(m.codigo || '').includes('CCMEI-BSN-0020'));
      if (hasNaoMei) {
        // Fallback para PGMEI tenta usar ano atual se não fornecido
        const pgmei = await consultarServico('PGMEI', cnpj, options);
        return NextResponse.json({ primary: result, fallback: pgmei });
      }
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('SERPRO API Error:', error);
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

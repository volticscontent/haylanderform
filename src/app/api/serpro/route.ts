import { NextResponse } from 'next/server';
import { consultarServico, SERVICE_CONFIG } from '@/lib/serpro';
import { saveConsultation } from '@/lib/serpro-db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cnpj, service, ano, mes, numeroRecibo, codigoReceita, categoria } = body as { 
      cnpj?: string; 
      service?: keyof typeof SERVICE_CONFIG; 
      ano?: string;
      mes?: string;
      numeroRecibo?: string;
      codigoReceita?: string;
      categoria?: string;
    };

    if (!cnpj) {
      return NextResponse.json({ error: 'CNPJ é obrigatório' }, { status: 400 });
    }

    const target = service || 'CCMEI_DADOS';
    const options = { ano, mes, numeroRecibo, codigoReceita, categoria };
    
    const result = await consultarServico(target, cnpj, options);

    let finalResult = result;
    
    if (target === 'CCMEI_DADOS' && result && typeof result === 'object') {
      const r = result as Record<string, unknown>;
      const mensagensRaw = (r.mensagens as unknown) ?? [];
      const mensagens: Array<{ codigo?: string; texto?: string }> = Array.isArray(mensagensRaw) ? mensagensRaw as Array<{ codigo?: string; texto?: string }> : [];
      const hasNaoMei = mensagens.some(m => String(m.texto || '').toLowerCase().includes('não possui mais a condição de mei'))
        || mensagens.some(m => String(m.codigo || '').includes('CCMEI-BSN-0020'));
      if (hasNaoMei) {
        // Fallback para PGMEI tenta usar ano atual se não fornecido
        const pgmei = await consultarServico('PGMEI', cnpj, options);
        finalResult = { primary: result, fallback: pgmei };
      }
    }

    // Save full history using the robust DB helper
    // We don't await this to speed up response, but we log errors inside the function
    saveConsultation(cnpj, target, finalResult, 200, 'admin');

    return NextResponse.json(finalResult);
  } catch (error: unknown) {
    console.error('SERPRO API Error:', error);
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

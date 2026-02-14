import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;

export const dynamic = 'force-dynamic'; // Prevent caching for Cron Jobs

export async function GET(request: Request) {
  // Security check: Vercel Cron jobs send a specific header
  const authHeader = request.headers.get('authorization');
  // You might want to check CRON_SECRET here if configured in Vercel
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

  try {
    // 0. Ensure Logs Table Exists (Auto-migration)
    // This allows us to track individual messages per disparo to avoid duplicates/spam
    await pool.query(`
      CREATE TABLE IF NOT EXISTS disparo_logs (
        id SERIAL PRIMARY KEY,
        disparo_id INTEGER REFERENCES disparos(id),
        phone VARCHAR(20),
        status VARCHAR(20),
        sent_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(disparo_id, phone)
      );
      CREATE INDEX IF NOT EXISTS idx_disparo_logs_disparo ON disparo_logs(disparo_id);
    `);

    // 1. Fetch ONE pending or processing disparo (Priority to processing to finish it)
    // We process only one campaign at a time per cron execution to keep it simple
    const result = await pool.query(`
      SELECT * FROM disparos 
      WHERE status IN ('pending', 'processing') 
      AND (schedule_at IS NULL OR schedule_at <= NOW())
      ORDER BY 
        CASE WHEN status = 'processing' THEN 0 ELSE 1 END, 
        created_at ASC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'No active disparos found' });
    }

    const disparo = result.rows[0];

    // Mark as processing if not already
    if (disparo.status !== 'processing') {
      await pool.query('UPDATE disparos SET status = $1, updated_at = NOW() WHERE id = $2', ['processing', disparo.id]);
    }

    // 2. Build Query for Targets
    const filters = disparo.filters || {};
    const whereClauses: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    // Helper: Column to Table Alias Mapping
    const getColumnWithAlias = (col: string) => {
      const map: Record<string, string> = {
        // leads
        'telefone': 'l.telefone',
        'nome_completo': 'l.nome_completo',
        'email': 'l.email',
        'data_cadastro': 'l.data_cadastro',
        'atualizado_em': 'l.atualizado_em',
        // leads_empresarial
        'cnpj': 'le.cnpj',
        'razao_social': 'le.razao_social',
        'tipo_negocio': 'le.tipo_negocio',
        'faturamento_mensal': 'le.faturamento_mensal',
        'cartao_cnpj': 'le.cartao_cnpj',
        // leads_qualificacao
        'situacao': 'lq.situacao',
        'qualificacao': 'lq.qualificacao',
        'motivo_qualificacao': 'lq.motivo_qualificacao',
        'interesse_ajuda': 'lq.interesse_ajuda',
        'possui_socio': 'lq.possui_socio',
        'pos_qualificacao': 'lq.pos_qualificacao',
        // leads_financeiro
        'calculo_parcelamento': 'lf.calculo_parcelamento',
        'valor_divida_ativa': 'lf.valor_divida_ativa',
        'valor_divida_municipal': 'lf.valor_divida_municipal',
        'valor_divida_estadual': 'lf.valor_divida_estadual',
        'valor_divida_federal': 'lf.valor_divida_federal',
        'tipo_divida': 'lf.tipo_divida',
        // leads_atendimento
        'envio_disparo': 'la.envio_disparo',
        'observacoes': 'la.observacoes',
        'data_controle_24h': 'la.data_controle_24h',
        // leads_vendas
        'servico_negociado': 'lv.servico_negociado',
        'procuracao': 'lv.procuracao',
        'data_reuniao': 'lv.data_reuniao'
      };
      return map[col] || `l.${col}`;
    };

    // --- Apply Filters ---
    
    // Search Term
    if (filters.searchTerm) {
      whereClauses.push(`(l.nome_completo ILIKE $${paramIndex} OR l.telefone ILIKE $${paramIndex} OR le.cnpj ILIKE $${paramIndex})`);
      values.push(`%${filters.searchTerm}%`);
      paramIndex++;
    }

    // Explicit Phones List
    if (filters.phones && Array.isArray(filters.phones) && filters.phones.length > 0) {
      const placeholders = filters.phones.map(() => `$${paramIndex++}`).join(', ');
      whereClauses.push(`l.telefone IN (${placeholders})`);
      values.push(...filters.phones);
    }

    // Status Filter (envio_disparo) - Only if not 'all'
    if (filters.statusFilter && filters.statusFilter !== 'all') {
       if (filters.statusFilter === 'pendente') {
         whereClauses.push(`(la.envio_disparo IS NULL OR la.envio_disparo = 'Pendente')`);
       } else {
         whereClauses.push(`la.envio_disparo = $${paramIndex}`);
         values.push(filters.statusFilter);
         paramIndex++;
       }
    }

    // Advanced Criteria
    if (Array.isArray(filters.criteria)) {
       for (const c of filters.criteria) {
          if (!c.column || !/^[a-zA-Z0-9_]+$/.test(c.column)) continue;

          const colWithAlias = getColumnWithAlias(c.column);

          if (c.operator === 'in' && c.values?.length) {
             const placeholders = c.values.map(() => `$${paramIndex++}`).join(', ');
             whereClauses.push(`${colWithAlias} IN (${placeholders})`);
             values.push(...c.values);
          } else if (c.operator === 'not_in' && c.values?.length) {
             const placeholders = c.values.map(() => `$${paramIndex++}`).join(', ');
             whereClauses.push(`${colWithAlias} NOT IN (${placeholders})`);
             values.push(...c.values);
          } else if (c.operator === 'is_empty') {
             whereClauses.push(`(${colWithAlias} IS NULL OR ${colWithAlias}::text = '')`);
          } else if (c.operator === 'is_not_empty') {
             whereClauses.push(`(${colWithAlias} IS NOT NULL AND ${colWithAlias}::text <> '')`);
          }
          
          if (c.manualValue && c.operator !== 'in' && c.operator !== 'not_in') {
             whereClauses.push(`${colWithAlias}::text ILIKE $${paramIndex}`);
             values.push(`%${c.manualValue}%`);
             paramIndex++;
          }
       }
    }

    // --- CRITICAL: Exclude already sent targets for THIS disparo ---
    // We add this parameter to values array
    const disparoIdParamIndex = paramIndex;
    values.push(disparo.id); 
    whereClauses.push(`NOT EXISTS (SELECT 1 FROM disparo_logs dl WHERE dl.disparo_id = $${disparoIdParamIndex} AND dl.phone = l.telefone)`);

    // Build Final Query
    let query = `
      SELECT 
        l.telefone, l.nome_completo, l.email, l.data_cadastro,
        le.razao_social, le.cnpj,
        la.data_controle_24h,
        la.envio_disparo
      FROM leads l
      LEFT JOIN leads_empresarial le ON l.id = le.lead_id
      LEFT JOIN leads_qualificacao lq ON l.id = lq.lead_id
      LEFT JOIN leads_financeiro lf ON l.id = lf.lead_id
      LEFT JOIN leads_atendimento la ON l.id = la.lead_id
      LEFT JOIN leads_vendas lv ON l.id = lv.lead_id
    `;
    
    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Limit batch size (Vercel has 10-60s timeout, so keep it small)
    // 20 messages * 0.5s delay = 10s + processing time. Safe for Vercel Hobby/Pro.
    const BATCH_SIZE = 20; 
    query += ` LIMIT ${BATCH_SIZE}`;

    const targets = await pool.query(query, values);

    // If no targets left, the campaign is finished!
    if (targets.rows.length === 0) {
        await pool.query(`UPDATE disparos SET status = 'completed', updated_at = NOW() WHERE id = $1`, [disparo.id]);
        return NextResponse.json({ message: 'Disparo completed (no more targets)', id: disparo.id });
    }

    // 3. Process Batch
    let sentCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (const target of targets.rows) {
      try {
         // Check 24h Window (Optional logic, can be removed if not needed)
         const lastInteraction = target.data_controle_24h ? new Date(target.data_controle_24h) : null;
         if (lastInteraction) {
             const diffHours = (new Date().getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);
             if (diffHours < 24) {
                 // Skip but Log as skipped so we don't try again immediately?
                 // If we log it, we won't try again for this disparo. That's correct behavior (don't send).
                 console.warn(`[Disparo] Skipping ${target.telefone}: Within 24h window`);
                 skippedCount++;
                 await pool.query(`INSERT INTO disparo_logs (disparo_id, phone, status) VALUES ($1, $2, 'skipped_24h')`, [disparo.id, target.telefone]);
                 continue;
             }
         }

         // Format Body
         const messageText = disparo.body.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_: string, key: string) => {
           // We only fetched a few columns. If user used other columns in template, they might be missing.
           // Ideally we should fetch all columns or the ones used in template. 
           // For now, we fetched common ones.
           const val = target[key as keyof typeof target];
           return val == null ? '' : String(val);
         });

         // Send
         await sendWhatsAppMessage(target.telefone, messageText, disparo.instance_name);
         
         // Log Success
         await pool.query(`INSERT INTO disparo_logs (disparo_id, phone, status) VALUES ($1, $2, 'sent')`, [disparo.id, target.telefone]);
         sentCount++;
         
         // Small delay to prevent rate limits
         await new Promise(r => setTimeout(r, 200));

      } catch (e) {
         console.error(`Falha ao enviar para ${target.telefone}:`, e);
         failCount++;
         // Log Failure so we don't retry endlessly (or we could NOT log to retry later? Better to log as failed)
         await pool.query(`INSERT INTO disparo_logs (disparo_id, phone, status) VALUES ($1, $2, 'failed')`, [disparo.id, target.telefone]);
      }
    }

    // 4. Update Stats
    // We calculate total stats from logs
    const statsQuery = `
        SELECT 
            COUNT(*) FILTER (WHERE status = 'sent') as sent,
            COUNT(*) FILTER (WHERE status = 'failed') as failed,
            COUNT(*) FILTER (WHERE status LIKE 'skipped%') as skipped,
            COUNT(*) as total_processed
        FROM disparo_logs 
        WHERE disparo_id = $1
    `;
    const statsRes = await pool.query(statsQuery, [disparo.id]);
    const stats = statsRes.rows[0];

    await pool.query(`
      UPDATE disparos 
      SET stats = $1, updated_at = NOW() 
      WHERE id = $2
    `, [JSON.stringify(stats), disparo.id]);

    return NextResponse.json({ 
        message: 'Batch processed', 
        disparo_id: disparo.id, 
        batch_size: BATCH_SIZE,
        processed: targets.rows.length,
        stats 
    });

  } catch (err: unknown) {
    console.error('Erro no processamento de disparos:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

async function sendWhatsAppMessage(to: string, text: string, instanceName?: string | null) {
  if (!text || !to) return;
  const cleanPhone = to.replace(/\D/g, '');

  if (instanceName) {
     const apiUrl = process.env.EVOLUTION_API_URL || 'https://evolutionapi.landcriativa.com';
     const url = `${apiUrl.replace(/\/$/, '')}/message/sendText/${instanceName}`;
     const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.EVOLUTION_API_KEY || ''
        },
        body: JSON.stringify({ number: cleanPhone, text: text })
     });
     if (!response.ok) throw new Error(`Evolution API Error: ${response.status}`);
     return;
  }

  // Fallback / Mock
  if (!WHATSAPP_API_URL) {
    console.log(`[MOCK SEND] To: ${cleanPhone}, Text: ${text}`);
    return;
  }
  
  // Existing WhatsApp API logic...
  const response = await fetch(`${WHATSAPP_API_URL}/message/sendText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': WHATSAPP_API_KEY || '' },
    body: JSON.stringify({ number: cleanPhone, text: text })
  });
  if (!response.ok) throw new Error(`WhatsApp API Error: ${response.status}`);
}


import { NextResponse } from 'next/server'
import pool from '@/lib/db'

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;

export async function GET() {
  // Check authorization if needed (e.g. CRON_SECRET)
  
  try {
    // 1. Fetch pending disparos ready to send
    const result = await pool.query(`
      SELECT * FROM disparos 
      WHERE status = 'pending' 
      AND (schedule_at IS NULL OR schedule_at <= NOW())
      ORDER BY created_at ASC
      LIMIT 5
    `);

    const disparos = result.rows;
    const report = [];

    for (const disparo of disparos) {
      // Mark as processing
      await pool.query('UPDATE disparos SET status = $1 WHERE id = $2', ['processing', disparo.id]);

      try {
        const filters = disparo.filters || {};
        const whereClauses: string[] = [];
        const values: (string | number | boolean | null)[] = [];
        let paramIndex = 1;

        // Column to Table Alias Mapping
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
          return map[col] || `l.${col}`; // Default to leads if unknown, though dangerous
        };

        // 1. Search Term (Nome, Telefone, CNPJ)
         if (filters.searchTerm) {
            whereClauses.push(`(l.nome_completo ILIKE $${paramIndex} OR l.telefone ILIKE $${paramIndex} OR le.cnpj ILIKE $${paramIndex})`);
            values.push(`%${filters.searchTerm}%`);
            paramIndex++;
         }

         // 1.5 Explicit Phones List
         if (filters.phones && Array.isArray(filters.phones) && filters.phones.length > 0) {
            const placeholders = filters.phones.map(() => `$${paramIndex++}`).join(', ');
            whereClauses.push(`l.telefone IN (${placeholders})`);
            values.push(...filters.phones);
         }

        // 2. Status Filter (envio_disparo)
        if (filters.statusFilter && filters.statusFilter !== 'all') {
           if (filters.statusFilter === 'pendente') {
             whereClauses.push(`(la.envio_disparo IS NULL OR la.envio_disparo = 'Pendente')`);
           } else {
             whereClauses.push(`la.envio_disparo = $${paramIndex}`);
             values.push(filters.statusFilter);
             paramIndex++;
           }
        }

        // 3. Criteria
        if (Array.isArray(filters.criteria)) {
           for (const c of filters.criteria) {
              if (!c.column) continue;
              
              // Validate column name
              if (!/^[a-zA-Z0-9_]+$/.test(c.column)) continue;

              const colWithAlias = getColumnWithAlias(c.column);

              if (c.operator === 'in') {
                 if (c.values && c.values.length > 0) {
                    const placeholders = c.values.map(() => `$${paramIndex++}`).join(', ');
                    whereClauses.push(`${colWithAlias} IN (${placeholders})`);
                    values.push(...c.values);
                 }
              } else if (c.operator === 'not_in') {
                 if (c.values && c.values.length > 0) {
                    const placeholders = c.values.map(() => `$${paramIndex++}`).join(', ');
                    whereClauses.push(`${colWithAlias} NOT IN (${placeholders})`);
                    values.push(...c.values);
                 }
              } else if (c.operator === 'is_empty') {
                 whereClauses.push(`(${colWithAlias} IS NULL OR ${colWithAlias}::text = '')`);
              } else if (c.operator === 'is_not_empty') {
                 whereClauses.push(`(${colWithAlias} IS NOT NULL AND ${colWithAlias}::text <> '')`);
              }
              
              if (c.manualValue && c.operator !== 'in') {
                 whereClauses.push(`${colWithAlias}::text ILIKE $${paramIndex}`);
                 values.push(`%${c.manualValue}%`);
                 paramIndex++;
              }
           }
        }

        let query = `
          SELECT 
            l.telefone, l.nome_completo, l.email, l.data_cadastro,
            le.razao_social, le.cnpj, le.tipo_negocio, le.faturamento_mensal, le.cartao_cnpj,
            lq.situacao, lq.qualificacao, lq.motivo_qualificacao, lq.interesse_ajuda, lq.possui_socio, lq.pos_qualificacao,
            lf.calculo_parcelamento, lf.valor_divida_ativa, lf.valor_divida_municipal, lf.valor_divida_estadual, lf.valor_divida_federal, lf.tipo_divida,
            la.envio_disparo, la.observacoes, la.data_controle_24h,
            lv.servico_negociado, lv.procuracao, lv.data_reuniao
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

        const targets = await pool.query(query, values);
        
        let sentCount = 0;
        let failCount = 0;

        for (const target of targets.rows) {
          try {
             // Replace placeholders in body
             const messageText = disparo.body.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_: string, key: string) => {
               const val = target[key];
               return val == null ? '' : String(val);
             });

             await sendWhatsAppMessage(target.telefone, messageText, disparo.instance_name);
             sentCount++;
             // Optional: Sleep to avoid rate limits
             await new Promise(r => setTimeout(r, 500)); 
          } catch (e) {
             console.error(`Falha ao enviar para ${target.telefone}:`, e);
             failCount++;
          }
        }

        // Mark as completed
        await pool.query(`
          UPDATE disparos 
          SET status = 'completed', 
              stats = $1, 
              updated_at = NOW() 
          WHERE id = $2
        `, [JSON.stringify({ sent: sentCount, failed: failCount, total: targets.rows.length }), disparo.id]);

        report.push({ id: disparo.id, status: 'completed', sent: sentCount });

      } catch (err: unknown) {
        console.error(`Erro ao processar disparo ${disparo.id}:`, err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        await pool.query('UPDATE disparos SET status = $1, updated_at = NOW() WHERE id = $2', ['failed', disparo.id]);
        report.push({ id: disparo.id, status: 'failed', error: errorMessage });
      }
    }

    return NextResponse.json({ processed: disparos.length, details: report });

  } catch (err: unknown) {
    console.error('Erro no processamento de disparos:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function sendWhatsAppMessage(to: string, text: string, instanceName?: string | null) {
  if (!text || !to) return;

  // Format phone if needed (remove non-digits)
  const cleanPhone = to.replace(/\D/g, '');

  // 1. Use Evolution API with Instance Name if provided
  if (instanceName) {
     const apiUrl = process.env.EVOLUTION_API_URL || 'https://evolutionapi.landcriativa.com';
     // Strip trailing slash if present
     const baseUrl = apiUrl.replace(/\/$/, '');
     const url = `${baseUrl}/message/sendText/${instanceName}`;
     const apiKey = process.env.EVOLUTION_API_KEY || '';

     const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey
        },
        body: JSON.stringify({
            number: cleanPhone,
            text: text
        })
     });

     if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Evolution API Error (${instanceName}): ${response.status} - ${errorText}`);
     }
     return;
  }

  if (!WHATSAPP_API_URL) {
    console.log(`[MOCK SEND] To: ${cleanPhone}, Text: ${text}`);
    return;
  }

  const response = await fetch(`${WHATSAPP_API_URL}/message/sendText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': WHATSAPP_API_KEY || ''
    },
    body: JSON.stringify({
      number: cleanPhone,
      text: text
    })
  });

  if (!response.ok) {
     const errorText = await response.text();
     throw new Error(`WhatsApp API Error: ${response.status} - ${errorText}`);
  }
}

import { Pool } from 'pg';

// Use a singleton pool instance if available via global or create new
// Assuming standard Next.js connection pooling pattern might be complex here, 
// so we'll use a local pool but ideally this should use the centralized db lib if it exists.
// Checking src/lib/db.ts usage in other files...
// Found 'import pool from "@/lib/db";' in agendamento-actions.ts. Let's use that.

import pool from '@/lib/db';

export async function saveConsultation(cnpj: string, service: string, result: any, status: number) {
  try {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    console.log(`[DB] Salvando consulta Serpro para CNPJ ${cleanCnpj}, serviço ${service}`);
    
    const query = `
      INSERT INTO consultas_serpro (cnpj, tipo_servico, resultado, status, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `;
    
    const res = await pool.query(query, [cleanCnpj, service, result, status]);
    console.log(`[DB] Consulta salva com sucesso. ID: ${res.rows[0].id}`);
    
    // Atualizar também a data da última consulta na tabela leads_atendimento
    await updateLastConsultationDate(cleanCnpj);
    
  } catch (error) {
    console.error('[DB] Erro ao salvar consulta Serpro:', error);
    // Don't throw, we don't want to break the API response if logging fails
  }
}

async function updateLastConsultationDate(cnpj: string) {
  try {
    // Encontrar o lead pelo CNPJ
    // Precisamos juntar leads_empresarial para achar o lead_id
    const findLeadQuery = `
        SELECT lead_id FROM leads_empresarial WHERE cnpj = $1 LIMIT 1
    `;
    const leadRes = await pool.query(findLeadQuery, [cnpj]);
    
    if (leadRes.rows.length > 0) {
        const leadId = leadRes.rows[0].lead_id;
        
        // Upsert em leads_atendimento
        const updateQuery = `
            INSERT INTO leads_atendimento (lead_id, data_ultima_consulta, updated_at)
            VALUES ($1, NOW(), NOW())
            ON CONFLICT (lead_id) 
            DO UPDATE SET 
                data_ultima_consulta = NOW(),
                updated_at = NOW()
        `;
        await pool.query(updateQuery, [leadId]);
        console.log(`[DB] Data da última consulta atualizada para Lead ID ${leadId}`);
    } else {
        console.log(`[DB] Lead não encontrado para CNPJ ${cnpj} (não foi possível atualizar data_ultima_consulta)`);
    }
  } catch (error) {
    console.error('[DB] Erro ao atualizar data da última consulta:', error);
  }
}

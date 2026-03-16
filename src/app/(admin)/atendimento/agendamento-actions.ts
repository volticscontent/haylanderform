'use server';

import pool from "@/lib/db";
import { evolutionSendTextMessage } from "@/lib/evolution";

export interface SchedulingLead {
  id: number;
  nome_completo: string | null;
  telefone: string;
  cnpj: string | null;
  razao_social: string | null;
  nome_fantasia: string | null;
}

export async function searchLeadsForScheduling(term: string): Promise<{ success: boolean; data?: SchedulingLead[]; error?: string }> {
  try {
    if (!term || term.length < 3) {
      return { success: true, data: [] };
    }

    const searchTerm = `%${term}%`;
    const cleanTerm = term.replace(/\D/g, ''); // Para busca numérica (CNPJ/Tel)

    let query = `
      SELECT 
        l.id,
        l.nome_completo,
        l.telefone,
        le.cnpj,
        le.razao_social,
        le.nome_fantasia
      FROM leads l
      LEFT JOIN leads_empresarial le ON l.id = le.lead_id
      WHERE 
        l.nome_completo ILIKE $1 OR
        le.razao_social ILIKE $1 OR
        le.nome_fantasia ILIKE $1
    `;

    const params: (string | number)[] = [searchTerm];

    if (cleanTerm.length > 0) {
        query += ` OR l.telefone LIKE $2 OR le.cnpj LIKE $2`;
        params.push(`%${cleanTerm}%`);
    }

    query += ` LIMIT 20`;

    const result = await pool.query(query, params);
    
    return { success: true, data: result.rows };
  } catch (error) {
    console.error("Error searching leads for scheduling:", error);
    return { success: false, error: "Erro ao buscar clientes." };
  }
}

export async function sendSchedulingLink(phone: string, link: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!phone) {
        return { success: false, error: "Telefone não fornecido." };
    }

    // Formatar telefone para o padrão da Evolution (apenas números)
    const formattedPhone = phone.replace(/\D/g, '');
    const jid = `${formattedPhone}@s.whatsapp.net`;

    const message = `Olá! Segue o link para agendamento da sua reunião:\n\n${link}\n\nQualquer dúvida, estamos à disposição.`;

    await evolutionSendTextMessage(jid, message);

    return { success: true };
  } catch (error) {
    console.error("Error sending scheduling link:", error);
    return { success: false, error: "Erro ao enviar mensagem." };
  }
}

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source'); // 'admin' or 'bot'

    // Fetch unique CNPJs from consultations, prioritizing latest ones
    // We join with leads to get lead info if available
    
    // Condition for source filtering
    const sourceCondition = source ? `WHERE source = '${source}'` : '';

    // We fetch more than 10 because we need to re-sort by date after DISTINCT ON
    // But since we want "Latest consultations globally", using DISTINCT ON (cnpj) might not give us the global latest 10 directly if we don't sort by date first.
    // Better approach: Subquery to get max date per CNPJ, then join.
    
    const betterQuery = `
      WITH LatestConsultations AS (
        SELECT 
          cnpj, 
          MAX(created_at) as last_consultation_date
        FROM consultas_serpro
        ${sourceCondition}
        GROUP BY cnpj
      )
      SELECT 
        lc.cnpj as raw_cnpj,
        lc.last_consultation_date as created_at,
        c.resultado,
        l.id as lead_id, 
        l.nome_completo, 
        l.telefone,
        l.email,
        lv.procuracao_ativa, 
        lv.procuracao_validade 
      FROM LatestConsultations lc
      JOIN consultas_serpro c ON c.cnpj = lc.cnpj AND c.created_at = lc.last_consultation_date
      LEFT JOIN leads_empresarial le ON REGEXP_REPLACE(le.cnpj, '\\D', '', 'g') = REGEXP_REPLACE(lc.cnpj, '\\D', '', 'g')
      LEFT JOIN leads l ON le.lead_id = l.id
      LEFT JOIN leads_vendas lv ON l.id = lv.lead_id
      ORDER BY lc.last_consultation_date DESC
      LIMIT 20
    `;
    
    const result = await pool.query(betterQuery);
    
    const clients = result.rows.map(row => {
      let nome = row.nome_completo || 'Nome não disponível';
      
      // Try to extract name from Serpro result if lead name is missing
      if (!row.nome_completo && row.resultado) {
        try {
           // Handle both structure types if necessary
           const resData = row.resultado;
           if (resData.dados && typeof resData.dados === 'string') {
              const parsedDados = JSON.parse(resData.dados);
              nome = parsedDados.nomeEmpresarial || parsedDados.empresario?.nomeCivil || nome;
           } else if (resData.ni) {
              nome = resData.nome || nome;
           }
        } catch (e) {
          console.error('Error parsing serpro result json:', e);
        }
      }

      return {
        id: row.lead_id || row.raw_cnpj, // Use CNPJ as fallback ID
        nome: nome,
        cnpj: row.raw_cnpj,
        telefone: row.telefone,
        email: row.email,
        data_ultima_consulta: row.created_at,
        procuracao_ativa: !!row.procuracao_ativa,
        procuracao_validade: row.procuracao_validade
      };
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching serpro clients:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

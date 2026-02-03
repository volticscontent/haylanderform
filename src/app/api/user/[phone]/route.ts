import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Helper to get full lead data with joins
const getFullLeadQuery = (whereClause: string) => `
  SELECT 
    l.id, l.telefone, l.nome_completo, l.email, l.senha_gov, l.data_cadastro, l.atualizado_em,
    le.razao_social, le.cnpj, le.cartao_cnpj, le.tipo_negocio, le.faturamento_mensal, le.endereco, le.numero, le.complemento, le.bairro, le.cidade, le.estado, le.cep, le.dados_serpro,
    la.observacoes, la.data_controle_24h, la.envio_disparo, la.data_ultima_consulta, la.atendente_id,
    lf.calculo_parcelamento, lf.valor_divida_ativa, lf.valor_divida_municipal, lf.valor_divida_estadual, lf.valor_divida_federal, lf.tipo_divida, lf.tem_divida, lf.tempo_divida,
    lq.situacao, lq.qualificacao, lq.motivo_qualificacao, lq.interesse_ajuda, lq.pos_qualificacao, lq.possui_socio,
    lv.servico_negociado, lv.procuracao, lv.procuracao_ativa, lv.procuracao_validade, lv.data_reuniao, lv.status_atendimento
  FROM leads l
  LEFT JOIN leads_empresarial le ON l.id = le.lead_id
  LEFT JOIN leads_qualificacao lq ON l.id = lq.lead_id
  LEFT JOIN leads_financeiro lf ON l.id = lf.lead_id
  LEFT JOIN leads_vendas lv ON l.id = lv.lead_id
  LEFT JOIN leads_atendimento la ON l.id = la.lead_id
  WHERE ${whereClause}
`;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const identifier = (await params).phone;
  const isEmail = identifier.includes('@');

  try {
    const query = getFullLeadQuery(isEmail ? "l.email = $1" : "l.telefone = $1");
    
    const res = await pool.query(query, [identifier]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const identifier = (await params).phone;
  const isEmail = identifier.includes('@');
  const body = await request.json();

  // Extract fields
  const {
    nome_completo,
    telefone,
    email,
    senha_gov,
    cnpj,
    tipo_negocio,
    possui_socio,
    tipo_divida,
    valor_divida_municipal,
    valor_divida_estadual,
    valor_divida_federal,
    valor_divida_ativa,
    faturamento_mensal,
    observacoes,
    interesse_ajuda,
    teria_interesse, // Legacy
    calculo_parcelamento,
    data_reuniao,
  } = body;

  const finalInteresse = interesse_ajuda || teria_interesse || null;
  const finalPossuiSocio = possui_socio === "Sim" || possui_socio === true;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Get Lead ID
    const idRes = await client.query(
      `SELECT id FROM leads WHERE ${isEmail ? 'email' : 'telefone'} = $1`, 
      [identifier]
    );
    
    let leadId;

    if (idRes.rowCount === 0) {
       // User not found, create new
       const newPhone = isEmail ? (telefone || null) : identifier;
       const newEmail = isEmail ? identifier : (email || null);
       
       const insertRes = await client.query(
         `INSERT INTO leads (telefone, nome_completo, email, senha_gov, data_cadastro, atualizado_em) 
          VALUES ($1, $2, $3, $4, NOW(), NOW()) 
          RETURNING id`,
         [newPhone, nome_completo || 'Desconhecido', newEmail, senha_gov || null]
       );
       leadId = insertRes.rows[0].id;
    } else {
       leadId = idRes.rows[0].id;

       // 2. Update leads (Core)
       await client.query(`
        UPDATE leads 
        SET 
          nome_completo = COALESCE($2, nome_completo),
          telefone = COALESCE($3, telefone),
          email = COALESCE($4, email),
          senha_gov = COALESCE($5, senha_gov),
          atualizado_em = NOW()
        WHERE id = $1
      `, [leadId, nome_completo, telefone, email, senha_gov]);
    }

    // 3. Update leads_empresarial
    await client.query(`
      INSERT INTO leads_empresarial (lead_id, cnpj, tipo_negocio, faturamento_mensal)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (lead_id) DO UPDATE SET
        cnpj = COALESCE(EXCLUDED.cnpj, leads_empresarial.cnpj),
        tipo_negocio = COALESCE(EXCLUDED.tipo_negocio, leads_empresarial.tipo_negocio),
        faturamento_mensal = COALESCE(EXCLUDED.faturamento_mensal, leads_empresarial.faturamento_mensal),
        updated_at = NOW()
    `, [leadId, cnpj, tipo_negocio, faturamento_mensal]);

    // 4. Update leads_qualificacao
    await client.query(`
      INSERT INTO leads_qualificacao (lead_id, possui_socio, interesse_ajuda)
      VALUES ($1, $2, $3)
      ON CONFLICT (lead_id) DO UPDATE SET
        possui_socio = COALESCE(EXCLUDED.possui_socio, leads_qualificacao.possui_socio),
        interesse_ajuda = COALESCE(EXCLUDED.interesse_ajuda, leads_qualificacao.interesse_ajuda),
        updated_at = NOW()
    `, [leadId, finalPossuiSocio, finalInteresse]);

    // 5. Update leads_financeiro
    await client.query(`
      INSERT INTO leads_financeiro (lead_id, tipo_divida, valor_divida_municipal, valor_divida_estadual, valor_divida_federal, valor_divida_ativa, calculo_parcelamento, tem_divida)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (lead_id) DO UPDATE SET
        tipo_divida = COALESCE(EXCLUDED.tipo_divida, leads_financeiro.tipo_divida),
        valor_divida_municipal = COALESCE(EXCLUDED.valor_divida_municipal, leads_financeiro.valor_divida_municipal),
        valor_divida_estadual = COALESCE(EXCLUDED.valor_divida_estadual, leads_financeiro.valor_divida_estadual),
        valor_divida_federal = COALESCE(EXCLUDED.valor_divida_federal, leads_financeiro.valor_divida_federal),
        valor_divida_ativa = COALESCE(EXCLUDED.valor_divida_ativa, leads_financeiro.valor_divida_ativa),
        calculo_parcelamento = COALESCE(EXCLUDED.calculo_parcelamento, leads_financeiro.calculo_parcelamento),
        tem_divida = COALESCE(EXCLUDED.tem_divida, leads_financeiro.tem_divida),
        updated_at = NOW()
    `, [leadId, tipo_divida, valor_divida_municipal, valor_divida_estadual, valor_divida_federal, valor_divida_ativa, calculo_parcelamento, !!tipo_divida]);

    // 6. Update leads_atendimento (Trigger logic moved here)
    await client.query(`
      INSERT INTO leads_atendimento (lead_id, observacoes, envio_disparo, data_controle_24h)
      VALUES ($1, $2, 'a1', NOW())
      ON CONFLICT (lead_id) DO UPDATE SET
        observacoes = COALESCE(EXCLUDED.observacoes, leads_atendimento.observacoes),
        envio_disparo = 'a1',
        data_controle_24h = NOW(),
        updated_at = NOW()
    `, [leadId, observacoes]);

    // 7. Update leads_vendas
    if (data_reuniao) {
      await client.query(`
        INSERT INTO leads_vendas (lead_id, data_reuniao)
        VALUES ($1, $2)
        ON CONFLICT (lead_id) DO UPDATE SET
          data_reuniao = EXCLUDED.data_reuniao,
          updated_at = NOW()
      `, [leadId, data_reuniao]);
    }

    await client.query('COMMIT');

    // Fetch updated data to return
    // Note: We can reuse the pool here, but we are inside a transaction with 'client',
    // so we should stick to 'client' or commit first. We committed above.
    const updatedRes = await pool.query(getFullLeadQuery('l.id = $1'), [leadId]);
    return NextResponse.json(updatedRes.rows[0]);

  } catch (error: unknown) {
    await client.query('ROLLBACK');
    console.error("Error updating user:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

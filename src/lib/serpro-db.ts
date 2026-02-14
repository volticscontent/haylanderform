// Use a singleton pool instance if available via global or create new
// Assuming standard Next.js connection pooling pattern might be complex here, 
// so we'll use a local pool but ideally this should use the centralized db lib if it exists.
// Checking src/lib/db.ts usage in other files...
// Found 'import pool from "@/lib/db";' in agendamento-actions.ts. Let's use that.

import pool from '@/lib/db';

interface SerproDados {
  nomeEmpresarial?: string;
  nomeFantasia?: string;
  situacaoCadastral?: string;
  dataAbertura?: string;
  cnaePrincipal?: { codigo?: string } | string;
  endereco?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cep?: string;
    municipio?: string;
    uf?: string;
  };
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  municipio?: string;
  uf?: string;
  empresario?: { nomeCivil?: string };
}

export async function saveConsultation(cnpj: string, service: string, result: unknown, status: number, source: string = 'admin') {
  try {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    console.log(`[DB] Salvando consulta Serpro para CNPJ ${cleanCnpj}, serviço ${service}, source ${source}`);
    
    const query = `
      INSERT INTO consultas_serpro (cnpj, tipo_servico, resultado, status, source, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id
    `;
    
    const res = await pool.query(query, [cleanCnpj, service, result, status, source]);
    console.log(`[DB] Consulta salva com sucesso. ID: ${res.rows[0].id}`);
    
    // Atualizar também a data da última consulta na tabela leads_atendimento
    await updateLastConsultationDate(cleanCnpj);

    // Atualizar dados do cliente nas tabelas leads e leads_empresarial
    await updateLeadDataFromSerpro(cleanCnpj, service, result);
    
  } catch (error) {
    console.error('[DB] Erro ao salvar consulta Serpro:', error);
    // Don't throw, we don't want to break the API response if logging fails
  }
}

async function updateLeadDataFromSerpro(cnpj: string, service: string, result: unknown) {
  try {
    if (service !== 'CCMEI_DADOS' && service !== 'CCMEI') return;

    // Extrair dados relevantes
    const resultObj = result as { dados?: unknown } | null;
    let dados: SerproDados | null = null;
    
    const rawDados = (resultObj && typeof resultObj === 'object' && 'dados' in resultObj) ? resultObj.dados : result;

    if (typeof rawDados === 'string') {
      try {
        dados = JSON.parse(rawDados) as SerproDados;
      } catch (e) {
        console.error('[DB] Erro ao fazer parse dos dados Serpro:', e);
        return;
      }
    } else {
        dados = rawDados as SerproDados;
    }

    if (!dados) return;

    // Mapear campos
    const razaoSocial = dados.nomeEmpresarial;
    const nomeFantasia = dados.nomeFantasia;
    // Campos removidos pois não eram usados: situacao, dataAbertura, cnae
    
    // Endereço
    const logradouro = dados.endereco?.logradouro || dados.logradouro;
    const numero = dados.endereco?.numero || dados.numero;
    const complemento = dados.endereco?.complemento || dados.complemento;
    const bairro = dados.endereco?.bairro || dados.bairro;
    const cep = dados.endereco?.cep || dados.cep;
    const cidade = dados.endereco?.municipio || dados.municipio;
    const uf = dados.endereco?.uf || dados.uf;
    
    const enderecoCompleto = [logradouro, numero, complemento, bairro, cidade, uf, cep]
      .filter(Boolean).join(', ');

    // Empresário (para atualizar nome no lead se necessário)
    const nomeEmpresario = dados.empresario?.nomeCivil;

    // Buscar lead_id
    const findLeadQuery = `
        SELECT lead_id FROM leads_empresarial 
        WHERE REGEXP_REPLACE(cnpj, '\\D', '', 'g') = $1 
        LIMIT 1
    `;
    const leadRes = await pool.query(findLeadQuery, [cnpj]);

    if (leadRes.rows.length > 0) {
      const leadId = leadRes.rows[0].lead_id;

      // Atualizar leads_empresarial
      const updateEmpresarialQuery = `
        UPDATE leads_empresarial
        SET 
          razao_social = COALESCE($1, razao_social),
          nome_fantasia = COALESCE($2, nome_fantasia),
          endereco = COALESCE($3, endereco),
          numero = COALESCE($4, numero),
          complemento = COALESCE($5, complemento),
          bairro = COALESCE($6, bairro),
          cidade = COALESCE($7, cidade),
          estado = COALESCE($8, estado),
          cep = COALESCE($9, cep),
          dados_serpro = $10,
          updated_at = NOW()
        WHERE lead_id = $11
      `;

      await pool.query(updateEmpresarialQuery, [
        razaoSocial,
        nomeFantasia,
        enderecoCompleto,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        cep,
        result, // Salva o JSON completo do resultado
        leadId
      ]);
      
      console.log(`[DB] Dados empresariais atualizados para Lead ID ${leadId}`);

      // Atualizar nome no leads se disponível e se for genérico/vazio
      if (nomeEmpresario) {
        // Verificar nome atual
        const leadQuery = 'SELECT nome_completo FROM leads WHERE id = $1';
        const leadData = await pool.query(leadQuery, [leadId]);
        
        if (leadData.rows.length > 0) {
          const currentName = leadData.rows[0].nome_completo;
          if (!currentName || currentName === 'Desconhecido' || currentName.trim() === '') {
            await pool.query('UPDATE leads SET nome_completo = $1 WHERE id = $2', [nomeEmpresario, leadId]);
            console.log(`[DB] Nome do lead atualizado para: ${nomeEmpresario}`);
          }
        }
      }

    } else {
        console.log(`[DB] Lead não encontrado para atualização de dados (CNPJ ${cnpj})`);
        // Opcional: Criar lead novo? Por enquanto seguimos a regra de apenas atualizar existentes.
    }

  } catch (error) {
    console.error('[DB] Erro ao atualizar dados do lead com Serpro:', error);
  }
}

async function updateLastConsultationDate(cnpj: string) {
  try {
    // Encontrar o lead pelo CNPJ
    // Precisamos juntar leads_empresarial para achar o lead_id
    // Usamos REGEXP_REPLACE para comparar apenas números, pois o banco tem formatos mistos
    const findLeadQuery = `
        SELECT lead_id FROM leads_empresarial 
        WHERE REGEXP_REPLACE(cnpj, '\\D', '', 'g') = $1 
        LIMIT 1
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


import dotenv from 'dotenv';
dotenv.config();

import pool from '../lib/db';
import { generatePhoneVariations } from '../lib/phone-utils';

async function checkLead() {
    const phone = '553182354127';
    console.log(`Checking lead with phone: ${phone}`);

    try {
        const cleanPhone = phone.replace(/\D/g, '');
        console.log(`Clean phone: ${cleanPhone}`);
        
        const baseQuery = `
            SELECT 
                l.id,
                l.telefone, 
                l.nome_completo, 
                l.email,
                l.data_cadastro,
                l.atualizado_em,
                
                -- leads_empresarial
                le.razao_social,
                le.cnpj, 
                le.cartao_cnpj,
                le.tipo_negocio,
                le.faturamento_mensal,
                le.endereco,
                le.numero,
                le.complemento,
                le.bairro,
                le.cidade,
                le.estado,
                le.cep,
                le.dados_serpro,

                -- leads_atendimento
                la.observacoes,
                la.data_controle_24h,
                la.envio_disparo,
                la.data_ultima_consulta,
                la.atendente_id,

                -- leads_financeiro
                lf.calculo_parcelamento, 
                lf.valor_divida_ativa,
                lf.valor_divida_municipal,
                lf.valor_divida_estadual,
                lf.valor_divida_federal,
                lf.tipo_divida,
                lf.tem_divida,
                lf.tempo_divida,

                -- leads_qualificacao
                lq.situacao,
                lq.qualificacao,
                lq.motivo_qualificacao,
                lq.interesse_ajuda,
                lq.pos_qualificacao,
                lq.possui_socio,

                -- leads_vendas
                lv.servico_negociado,
                lv.status_atendimento,
                lv.data_reuniao,
                lv.procuracao,
                lv.procuracao_ativa,
                lv.procuracao_validade

            FROM leads l
            LEFT JOIN leads_empresarial le ON l.id = le.lead_id
            LEFT JOIN leads_qualificacao lq ON l.id = lq.lead_id
            LEFT JOIN leads_financeiro lf ON l.id = lf.lead_id
            LEFT JOIN leads_vendas lv ON l.id = lv.lead_id
            LEFT JOIN leads_atendimento la ON l.id = la.lead_id
        `;

        // Try exact match first
        let result = await pool.query(`${baseQuery} WHERE l.telefone = $1`, [cleanPhone]);
        console.log(`Exact match result: ${result.rows.length}`);
        
        if (result.rows.length === 0) {
            // Try variations
            const variations = generatePhoneVariations(cleanPhone);
            if (variations.length > 0) {
                const placeholders = variations.map((_, i) => `$${i + 1}`).join(', ');
                result = await pool.query(`${baseQuery} WHERE l.telefone IN (${placeholders}) LIMIT 1`, variations);
                console.log(`Variations match result: ${result.rows.length}`);
            }
        }

        if (result.rows.length > 0) {
            const lead = result.rows[0];
            console.log('Lead Found:', lead.nome_completo, lead.telefone);
            console.log('Dados Serpro (raw):', lead.dados_serpro);
            console.log('Dados Serpro (type):', typeof lead.dados_serpro);

            const dadosSerpro = lead.dados_serpro || {};

            // Helper to check nested properties safely
            const getSerproValue = (key: string) => {
                return dadosSerpro[key] || null;
            };

            try {
                // Ensure dates are serialized to strings
                const serializedLead = {
                    ...lead,
                    // Map potentially missing fields from dados_serpro
                    tem_protestos: lead.tem_protestos || (getSerproValue('protestos') ? 'Sim' : null),
                    tem_execucao_fiscal: lead.tem_execucao_fiscal || (getSerproValue('execucao_fiscal') ? 'Sim' : null),
                    tem_divida_ativa: lead.tem_divida_ativa || (getSerproValue('divida_ativa') ? 'Sim' : null),
                    tem_parcelamento: lead.tem_parcelamento || (getSerproValue('parcelamento') ? 'Sim' : null),
                    
                    // Extra Serpro fields
                    porte_empresa: lead.porte_empresa || getSerproValue('porte_empresa') || null,
                    score_serasa: lead.score_serasa || getSerproValue('score_serasa') || null,
                    idades_socios: lead.idades_socios || getSerproValue('idades_socios') || null,
                    motivo_divida: lead.motivo_divida || getSerproValue('motivo_divida') || null,
                    tem_cartorios: lead.tem_cartorios || (getSerproValue('cartorios') ? 'Sim' : null),
                    parcelamento_ativo: lead.parcelamento_ativo || (getSerproValue('parcelamento_ativo') ? 'Sim' : null),
                    
                    data_cadastro: lead.data_cadastro ? new Date(lead.data_cadastro).toISOString() : null,
                    atualizado_em: lead.atualizado_em ? new Date(lead.atualizado_em).toISOString() : null,
                    data_controle_24h: lead.data_controle_24h ? new Date(lead.data_controle_24h).toISOString() : null,
                    envio_disparo: lead.envio_disparo,
                    data_ultima_consulta: lead.data_ultima_consulta ? new Date(lead.data_ultima_consulta).toISOString() : null,
                    data_reuniao: lead.data_reuniao ? new Date(lead.data_reuniao).toISOString() : null,
                    procuracao_validade: lead.procuracao_validade ? new Date(lead.procuracao_validade).toISOString() : null,
                };
                console.log('Serialized Lead constructed successfully:', serializedLead.id);
            } catch (serializationError) {
                console.error('Error during serialization:', serializationError);
            }

        } else {
            console.log('Lead NOT found with JOINs');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkLead();

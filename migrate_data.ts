
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrate() {
  const { default: pool } = await import('./src/lib/db');
  
  const client = await pool.connect();

  try {
    console.log("Starting migration...");

    // Fetch all data from old table
    const res = await client.query('SELECT * FROM haylander');
    const oldRows = res.rows;
    console.log(`Found ${oldRows.length} rows in 'haylander'.`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const row of oldRows) {
      try {
        // Map values
        let newSituacao = 'nao_respondido';
        if (row.situacao === 'falar_com_atendente') {
            newSituacao = 'qualificado'; // Mapping to a valid state
        } else if (['nao_respondido', 'desqualificado', 'qualificado', 'cliente'].includes(row.situacao)) {
            newSituacao = row.situacao;
        }

        let newQualificacao = null;
        if (row['qualificação'] === 'qualificado') {
            newQualificacao = 'SQL'; // Mapping 'qualificado' to 'SQL'
        } else if (['MQL', 'ICP', 'SQL'].includes(row['qualificação'])) {
            newQualificacao = row['qualificação'];
        }

        // Map columns
        const newRow = {
            telefone: row.telefone,
            nome_completo: row.nome_completo,
            email: row.email,
            cnpj: row.cnpj,
            razao_social: row.razao_social,
            cpf: row.cpf,
            data_nascimento: row.data_nascimento,
            nome_mae: row.nome_mae,
            titulo_eleitor_ir: row['titulo_eleitor_ou_recibo_ir'],
            
            cep: row.cep,
            endereco: row.endereco,
            numero: row.numero,
            complemento: row.complemento,
            bairro: row.bairro,
            cidade: row.cidade,
            // estado: missing in source
            
            nome_fantasia: row.nome_fantasia,
            tipo_negocio: row['tipo_negócio'],
            faturamento_mensal: row.faturamento_mensal,
            possui_socio: row['possui_sócio'],
            local_atividade: row.local_atividade,
            atividade_principal: row.atividade_principal,
            atividades_secundarias: row.atividades_secundarias,
            
            // tem_divida: not explicitly in source, maybe infer from tipo_divida?
            tem_divida: !!row.tipo_divida, 
            tipo_divida: row.tipo_divida,
            valor_divida_municipal: row.valor_divida_municipal,
            valor_divida_estadual: row.valor_divida_estadual,
            valor_divida_federal: row.valor_divida_federal,
            valor_divida_ativa: row.valor_divida_ativa,
            // tempo_divida: missing
            calculo_parcelamento: row.calculo_parcelamento,
            
            situacao: newSituacao,
            qualificacao: newQualificacao,
            motivo_qualificacao: row['motivo_qualificação'],
            interesse_ajuda: row['teria_interesse?'],
            
            // status_atendimento: default 'novo'
            
            data_reuniao: row['data_reunião'],
            
            data_cadastro: row.data_cadastro,
            atualizado_em: row.atualizado_em,
            data_controle_24h: row.data_controle_24h,
            envio_disparo: row.envio_disparo,
            // dados_serpro: maybe store cartão-cnpj here if needed?
            senha_gov: row.senha_gov,
            procuracao_ativa: row.procuracao_ativa,
            procuracao_validade: row.procuracao_validade,
            observacoes: row.observacoes
        };

        // Construct INSERT query dynamically
        const columns = (Object.keys(newRow) as Array<keyof typeof newRow>).filter(k => newRow[k] !== undefined);
        const values = columns.map(k => newRow[k]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        const query = `
            INSERT INTO leads (${columns.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT (telefone) DO NOTHING
        `;

        await client.query(query, values);
        migratedCount++;
      } catch (err) {
        console.error(`Error migrating row with phone ${row.telefone}:`, err);
        errorCount++;
      }
    }

    console.log(`Migration finished. Migrated: ${migratedCount}, Errors: ${errorCount}`);

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

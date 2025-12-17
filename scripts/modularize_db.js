import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting modularization migration...');

    // 1. Create new tables
    console.log('Creating tables...');
    
    // leads_empresarial
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads_empresarial (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        cnpj VARCHAR(255),
        razao_social TEXT,
        nome_fantasia TEXT,
        tipo_negocio VARCHAR(255),
        faturamento_mensal VARCHAR(255),
        endereco TEXT,
        numero VARCHAR(50),
        complemento TEXT,
        bairro TEXT,
        cidade TEXT,
        estado VARCHAR(50),
        cep VARCHAR(20),
        dados_serpro JSONB,
        cartao_cnpj VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(lead_id)
      );
    `);

    // leads_qualificacao
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads_qualificacao (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        situacao VARCHAR(50) CHECK (situacao IN ('nao_respondido', 'desqualificado', 'qualificado', 'cliente')),
        qualificacao VARCHAR(50) CHECK (qualificacao IN ('MQL', 'ICP', 'SQL', NULL)),
        motivo_qualificacao TEXT,
        interesse_ajuda VARCHAR(10),
        pos_qualificacao BOOLEAN,
        possui_socio BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(lead_id)
      );
    `);

    // leads_financeiro
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads_financeiro (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        tem_divida BOOLEAN,
        tipo_divida VARCHAR(255),
        valor_divida_municipal TEXT,
        valor_divida_estadual TEXT,
        valor_divida_federal TEXT,
        valor_divida_ativa TEXT,
        tempo_divida VARCHAR(255),
        calculo_parcelamento TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(lead_id)
      );
    `);

    // leads_vendas
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads_vendas (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        servico_negociado VARCHAR(255),
        status_atendimento VARCHAR(255),
        data_reuniao VARCHAR(255),
        procuracao BOOLEAN,
        procuracao_ativa BOOLEAN,
        procuracao_validade TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(lead_id)
      );
    `);

    // leads_atendimento
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads_atendimento (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
        atendente_id INTEGER,
        envio_disparo VARCHAR(255),
        data_controle_24h TIMESTAMP,
        data_ultima_consulta TIMESTAMP,
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(lead_id)
      );
    `);

    console.log('Tables created successfully.');

    // 2. Migrate Data
    console.log('Migrating data from leads table...');
    
    const { rows: leads } = await client.query('SELECT * FROM leads');
    console.log(`Found ${leads.length} leads to migrate.`);

    for (const lead of leads) {
      // leads_empresarial
      await client.query(`
        INSERT INTO leads_empresarial (
          lead_id, cnpj, razao_social, nome_fantasia, tipo_negocio, faturamento_mensal,
          endereco, numero, complemento, bairro, cidade, estado, cep, dados_serpro, cartao_cnpj
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (lead_id) DO NOTHING
      `, [
        lead.id, lead.cnpj, lead.razao_social, lead.nome_fantasia, lead.tipo_negocio, lead.faturamento_mensal,
        lead.endereco, lead.numero, lead.complemento, lead.bairro, lead.cidade, lead.estado, lead.cep,
        lead.dados_serpro, lead.cartao_cnpj
      ]);

      // leads_qualificacao
      await client.query(`
        INSERT INTO leads_qualificacao (
          lead_id, situacao, qualificacao, motivo_qualificacao, interesse_ajuda, pos_qualificacao, possui_socio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (lead_id) DO NOTHING
      `, [
        lead.id, lead.situacao, lead.qualificacao, lead.motivo_qualificacao, lead.interesse_ajuda,
        lead.pos_qualificacao, lead.possui_socio
      ]);

      // leads_financeiro
      await client.query(`
        INSERT INTO leads_financeiro (
          lead_id, tem_divida, tipo_divida, valor_divida_municipal, valor_divida_estadual,
          valor_divida_federal, valor_divida_ativa, tempo_divida, calculo_parcelamento
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (lead_id) DO NOTHING
      `, [
        lead.id, lead.tem_divida, lead.tipo_divida, lead.valor_divida_municipal, lead.valor_divida_estadual,
        lead.valor_divida_federal, lead.valor_divida_ativa, lead.tempo_divida, lead.calculo_parcelamento
      ]);

      // leads_vendas
      await client.query(`
        INSERT INTO leads_vendas (
          lead_id, servico_negociado, status_atendimento, data_reuniao, procuracao, procuracao_ativa, procuracao_validade
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (lead_id) DO NOTHING
      `, [
        lead.id, lead.servico_negociado, lead.status_atendimento, lead.data_reuniao, lead.procuracao,
        lead.procuracao_ativa, lead.procuracao_validade
      ]);

      // leads_atendimento
      await client.query(`
        INSERT INTO leads_atendimento (
          lead_id, atendente_id, envio_disparo, data_controle_24h, data_ultima_consulta, observacoes
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (lead_id) DO NOTHING
      `, [
        lead.id, lead.atendente_id, lead.envio_disparo, lead.data_controle_24h,
        lead.data_ultima_consulta, lead.observacoes
      ]);
    }

    console.log('Migration completed successfully.');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();

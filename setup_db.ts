import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from the correct path
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not defined in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log('Connected to database.');
    
    // 1. Drop existing tables (reverse order)
    console.log('Dropping existing tables...');
    await client.query(`DROP TABLE IF EXISTS leads_atendimento CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS leads_vendas CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS leads_financeiro CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS leads_qualificacao CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS leads_empresarial CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS leads CASCADE;`);

    // 2. Create Core Table: leads
    console.log("Creating 'leads' table...");
    await client.query(`
      CREATE TABLE leads (
        id SERIAL PRIMARY KEY,
        telefone VARCHAR(20) UNIQUE NOT NULL,
        nome_completo VARCHAR(255),
        email VARCHAR(255),
        data_cadastro TIMESTAMP DEFAULT NOW(),
        atualizado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. Create Satellite Tables
    console.log("Creating satellite tables...");

    // leads_empresarial
    await client.query(`
      CREATE TABLE leads_empresarial (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        cnpj VARCHAR(20),
        razao_social VARCHAR(255),
        nome_fantasia VARCHAR(255),
        tipo_negocio VARCHAR(100),
        faturamento_mensal VARCHAR(100),
        endereco TEXT,
        numero VARCHAR(20),
        complemento VARCHAR(100),
        bairro VARCHAR(100),
        cidade VARCHAR(100),
        estado VARCHAR(2),
        cep VARCHAR(10),
        dados_serpro JSONB,
        cartao_cnpj VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(lead_id)
      );
    `);

    // leads_qualificacao
    await client.query(`
      CREATE TABLE leads_qualificacao (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        situacao VARCHAR(50) CHECK (situacao IN ('nao_respondido', 'desqualificado', 'qualificado', 'cliente')),
        qualificacao VARCHAR(50) CHECK (qualificacao IN ('MQL', 'ICP', 'SQL')),
        motivo_qualificacao TEXT,
        interesse_ajuda VARCHAR(10),
        pos_qualificacao BOOLEAN,
        possui_socio BOOLEAN,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(lead_id)
      );
    `);

    // leads_financeiro
    await client.query(`
      CREATE TABLE leads_financeiro (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        tem_divida BOOLEAN,
        tipo_divida VARCHAR(100),
        valor_divida_municipal NUMERIC(15,2),
        valor_divida_estadual NUMERIC(15,2),
        valor_divida_federal NUMERIC(15,2),
        valor_divida_ativa NUMERIC(15,2),
        tempo_divida VARCHAR(50),
        calculo_parcelamento TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(lead_id)
      );
    `);

    // leads_vendas
    await client.query(`
      CREATE TABLE leads_vendas (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        servico_negociado VARCHAR(100),
        status_atendimento VARCHAR(100),
        data_reuniao TIMESTAMP,
        procuracao BOOLEAN,
        procuracao_ativa BOOLEAN,
        procuracao_validade DATE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(lead_id)
      );
    `);

    // leads_atendimento
    await client.query(`
      CREATE TABLE leads_atendimento (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        atendente_id VARCHAR(100),
        envio_disparo VARCHAR(50),
        data_controle_24h TIMESTAMP,
        data_ultima_consulta TIMESTAMP,
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(lead_id)
      );
    `);

    console.log("Tables created successfully.");

    // 4. Insert Test User
    console.log("Inserting test user...");
    
    // Insert into leads
    const insertLeadRes = await client.query(`
      INSERT INTO leads (telefone, nome_completo, email, data_cadastro, atualizado_em)
      VALUES ('5511999999999', 'Usuário de Teste', 'teste@exemplo.com', NOW(), NOW())
      RETURNING id;
    `);
    const leadId = insertLeadRes.rows[0].id;

    // Insert into satellites
    await client.query(`
      INSERT INTO leads_qualificacao (lead_id, situacao, qualificacao, interesse_ajuda)
      VALUES ($1, 'nao_respondido', NULL, 'sim');
    `, [leadId]);

    await client.query(`
      INSERT INTO leads_vendas (lead_id, status_atendimento)
      VALUES ($1, 'novo');
    `, [leadId]);
    
     await client.query(`
      INSERT INTO leads_atendimento (lead_id, observacoes)
      VALUES ($1, 'Usuário criado para teste');
    `, [leadId]);

    console.log(`Test user inserted successfully with ID: ${leadId}`);

  } catch (err) {
    console.error("Error setting up database:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();

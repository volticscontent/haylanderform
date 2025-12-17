import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTable() {
  const client = await pool.connect();
  try {
    console.log("Creating 'leads' table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        telefone VARCHAR(20) UNIQUE NOT NULL,
        nome_completo TEXT,
        email TEXT,
        cnpj VARCHAR(20),
        razao_social TEXT,
        cpf VARCHAR(14),
        data_nascimento DATE,
        nome_mae TEXT,
        titulo_eleitor_ir TEXT,
        
        -- Endereço
        cep VARCHAR(10),
        endereco TEXT,
        numero VARCHAR(20),
        complemento TEXT,
        bairro TEXT,
        cidade TEXT,
        estado VARCHAR(2),
        
        -- Dados de Negócio (MEI/Empresa)
        nome_fantasia TEXT,
        tipo_negocio VARCHAR(50),
        faturamento_mensal VARCHAR(50),
        possui_socio BOOLEAN,
        local_atividade VARCHAR(100),
        atividade_principal TEXT,
        atividades_secundarias TEXT,
        
        -- Dados Financeiros/Dívida
        tem_divida BOOLEAN,
        tipo_divida VARCHAR(100),
        valor_divida_municipal TEXT,
        valor_divida_estadual TEXT,
        valor_divida_federal TEXT,
        valor_divida_ativa TEXT,
        tempo_divida VARCHAR(50),
        calculo_parcelamento TEXT,
        
        -- Qualificação
        situacao VARCHAR(20) DEFAULT 'nao_respondido' CHECK (situacao IN ('nao_respondido', 'desqualificado', 'qualificado', 'cliente')),
        qualificacao VARCHAR(10) CHECK (qualificacao IN ('MQL', 'ICP', 'SQL')),
        motivo_qualificacao TEXT,
        interesse_ajuda VARCHAR(10),
        
        -- Atendimento
        status_atendimento VARCHAR(50) DEFAULT 'novo',
        atendente_id INT,
        data_reuniao VARCHAR(50),
        
        -- Sistema / Controle
        data_cadastro TIMESTAMP DEFAULT NOW(),
        atualizado_em TIMESTAMP DEFAULT NOW(),
        data_controle_24h TIMESTAMP,
        envio_disparo VARCHAR(50),
        dados_serpro JSONB,
        senha_gov TEXT,
        procuracao_ativa BOOLEAN DEFAULT FALSE,
        procuracao_validade TIMESTAMP,
        observacoes TEXT
      );
    `);
    console.log("Table 'leads' created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

createTable();

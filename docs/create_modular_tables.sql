
-- 1. Business Info
CREATE TABLE IF NOT EXISTS leads_empresarial (
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

-- 2. Qualification Info
CREATE TABLE IF NOT EXISTS leads_qualificacao (
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

-- 3. Financial Info
CREATE TABLE IF NOT EXISTS leads_financeiro (
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

-- 4. Sales Info
CREATE TABLE IF NOT EXISTS leads_vendas (
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

-- 5. Attendant Info
CREATE TABLE IF NOT EXISTS leads_atendimento (
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

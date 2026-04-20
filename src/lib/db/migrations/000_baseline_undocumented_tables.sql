-- Migration 000: Baseline — Tabelas criadas manualmente sem migration formal
-- Este arquivo serve como documentação e pode ser rodado em ambientes zerados.
-- Em produção, estas tabelas já existem — o IF NOT EXISTS garante idempotência.

-- ─── TABELA CENTRAL DE LEADS ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
    id                      SERIAL PRIMARY KEY,
    telefone                VARCHAR(20) UNIQUE NOT NULL,
    nome_completo           VARCHAR(255),
    email                   VARCHAR(255),
    cpf                     VARCHAR(14),
    data_nascimento         DATE,
    nome_mae                VARCHAR(255),
    senha_gov               VARCHAR(255),
    sexo                    VARCHAR(20),
    -- Controle de atendimento humano
    needs_attendant         BOOLEAN DEFAULT FALSE,
    attendant_requested_at  TIMESTAMPTZ,
    -- Timestamps
    data_cadastro           TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_telefone       ON leads(telefone);
CREATE INDEX IF NOT EXISTS idx_leads_needs_attendant ON leads(needs_attendant) WHERE needs_attendant = TRUE;

-- ─── DADOS EMPRESARIAIS ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads_empresarial (
    id               SERIAL PRIMARY KEY,
    lead_id          INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    cnpj             VARCHAR(18),
    razao_social     VARCHAR(255),
    nome_fantasia    VARCHAR(255),
    tipo_negocio     VARCHAR(100),
    faturamento_mensal VARCHAR(50),
    endereco         VARCHAR(255),
    numero           VARCHAR(20),
    complemento      VARCHAR(100),
    bairro           VARCHAR(100),
    cidade           VARCHAR(100),
    estado           VARCHAR(2),
    cep              VARCHAR(9),
    dados_serpro     JSONB,
    cartao_cnpj      TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (lead_id)
);

CREATE INDEX IF NOT EXISTS idx_leads_empresarial_cnpj ON leads_empresarial(cnpj);

-- ─── QUALIFICAÇÃO / FUNIL ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads_qualificacao (
    id                      SERIAL PRIMARY KEY,
    lead_id                 INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    situacao                VARCHAR(30) DEFAULT 'nao_respondido',
    qualificacao            VARCHAR(10),
    motivo_qualificacao     TEXT,
    interesse_ajuda         TEXT,
    pos_qualificacao        BOOLEAN DEFAULT FALSE,
    possui_socio            BOOLEAN,
    confirmacao_qualificacao BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (lead_id)
);

CREATE INDEX IF NOT EXISTS idx_leads_qualificacao_situacao ON leads_qualificacao(situacao);

-- ─── DADOS FINANCEIROS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads_financeiro (
    id                    SERIAL PRIMARY KEY,
    lead_id               INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    tem_divida            BOOLEAN,
    tipo_divida           VARCHAR(100),
    valor_divida_municipal NUMERIC(12,2),
    valor_divida_estadual  NUMERIC(12,2),
    valor_divida_federal   NUMERIC(12,2),
    valor_divida_ativa     NUMERIC(12,2),
    tempo_divida          VARCHAR(50),
    calculo_parcelamento  TEXT,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (lead_id)
);

-- ─── VENDAS / NEGOCIAÇÃO ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads_vendas (
    id                  SERIAL PRIMARY KEY,
    lead_id             INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    servico_negociado   VARCHAR(255),
    servico_escolhido   VARCHAR(255),
    status_atendimento  VARCHAR(50),
    data_reuniao        TIMESTAMPTZ,
    reuniao_agendada    BOOLEAN DEFAULT FALSE,
    procuracao          BOOLEAN DEFAULT FALSE,
    procuracao_ativa    BOOLEAN DEFAULT FALSE,
    procuracao_validade DATE,
    cliente             BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (lead_id)
);

-- ─── ATENDIMENTO ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads_atendimento (
    id                   SERIAL PRIMARY KEY,
    lead_id              INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    atendente_id         VARCHAR(100),
    envio_disparo        VARCHAR(50),
    observacoes          TEXT,
    data_controle_24h    TIMESTAMPTZ,
    data_ultima_consulta TIMESTAMPTZ,
    data_followup        TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (lead_id)
);

-- ─── DISPAROS (CAMPANHAS) ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS disparos (
    id            SERIAL PRIMARY KEY,
    channel       VARCHAR(50)  NOT NULL,
    instance_name VARCHAR(100),
    body          TEXT         NOT NULL,
    filters       JSONB        NOT NULL DEFAULT '{}',
    stats         JSONB,
    schedule_at   TIMESTAMPTZ,
    status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disparo_logs (
    id          SERIAL PRIMARY KEY,
    disparo_id  INTEGER NOT NULL REFERENCES disparos(id) ON DELETE CASCADE,
    phone       VARCHAR(20) NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'pending',
    sent_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (disparo_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_disparo_logs_disparo ON disparo_logs(disparo_id);

-- ─── HISTÓRICO DE CHAT (BOT) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_history (
    id         SERIAL PRIMARY KEY,
    phone      VARCHAR(20)  NOT NULL,
    role       VARCHAR(15)  NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content    TEXT         NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_phone      ON chat_history(phone);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

-- ─── CONFIGURAÇÕES DO SISTEMA ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS system_settings (
    key          VARCHAR(100) PRIMARY KEY,
    label        VARCHAR(255),
    type         VARCHAR(50),
    value        TEXT,
    allowed_bots TEXT[],
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- schema_v2.sql — Schema limpo para o banco n_db_pg
-- Consolidação: 6 tabelas de lead → 2  |  resource_tracking → JSONB inline
-- Aplicar em banco ZERADO com:
--   psql "postgres://..." -f schema_v2.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── EXTENSÕES ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- pgvector não disponível neste servidor; embedding armazenado como REAL[]

-- ─── LEADS ───────────────────────────────────────────────────────────────────
-- Incorpora: leads + leads_empresarial + leads_qualificacao + leads_financeiro
-- Removidos: dados_serpro (legacy), cartao_cnpj (legacy)
-- Renomeado: valor_divida_ativa → valor_divida_pgfn
-- Adicionado: metadata JSONB (absorve dados de formulários/extra)
-- Segurança: senha_gov_enc (pgp_sym_encrypt via pgcrypto, chave em PGCRYPTO_KEY)

CREATE TABLE IF NOT EXISTS leads (
    id                       SERIAL PRIMARY KEY,

    -- Identidade
    telefone                 VARCHAR(20)  UNIQUE NOT NULL,
    nome_completo            VARCHAR(255),
    email                    VARCHAR(255),
    cpf                      VARCHAR(14),
    data_nascimento          DATE,
    nome_mae                 VARCHAR(255),
    sexo                     VARCHAR(20),
    senha_gov_enc            TEXT,

    -- Empresa
    cnpj                     VARCHAR(18),
    razao_social             VARCHAR(255),
    nome_fantasia            VARCHAR(255),
    tipo_negocio             VARCHAR(100),
    faturamento_mensal       VARCHAR(50),

    -- Endereço
    endereco                 VARCHAR(255),
    numero                   VARCHAR(20),
    complemento              VARCHAR(100),
    bairro                   VARCHAR(100),
    cidade                   VARCHAR(100),
    estado                   VARCHAR(2),
    cep                      VARCHAR(9),

    -- Funil / Qualificação
    situacao                 VARCHAR(30)  DEFAULT 'nao_respondido',
    qualificacao             VARCHAR(10),
    motivo_qualificacao      TEXT,
    interesse_ajuda          TEXT,
    pos_qualificacao         BOOLEAN      DEFAULT FALSE,
    possui_socio             BOOLEAN,
    confirmacao_qualificacao BOOLEAN      DEFAULT FALSE,

    -- Financeiro
    tem_divida               BOOLEAN,
    tipo_divida              VARCHAR(100),
    valor_divida_municipal   NUMERIC(12,2),
    valor_divida_estadual    NUMERIC(12,2),
    valor_divida_federal     NUMERIC(12,2),
    valor_divida_pgfn        NUMERIC(12,2),
    tempo_divida             VARCHAR(50),
    calculo_parcelamento     TEXT,

    -- Atendimento humano
    needs_attendant          BOOLEAN      DEFAULT FALSE,
    attendant_requested_at   TIMESTAMPTZ,

    -- Dados extras de formulários (substitui dados_serpro/cartao_cnpj legados)
    metadata                 JSONB,

    -- Timestamps
    data_cadastro            TIMESTAMPTZ  DEFAULT NOW(),
    atualizado_em            TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_telefone        ON leads(telefone);
CREATE INDEX IF NOT EXISTS idx_leads_cnpj            ON leads(cnpj);
CREATE INDEX IF NOT EXISTS idx_leads_situacao        ON leads(situacao);
CREATE INDEX IF NOT EXISTS idx_leads_qualificacao    ON leads(qualificacao);
CREATE INDEX IF NOT EXISTS idx_leads_needs_attendant ON leads(needs_attendant) WHERE needs_attendant = TRUE;

-- ─── LEADS_PROCESSO ──────────────────────────────────────────────────────────
-- Incorpora: leads_vendas + leads_atendimento + resource_tracking
-- Removidos: reuniao_agendada (= data_reuniao IS NOT NULL), servico_negociado,
--            servico_escolhido (unificados em `servico`)
-- Adicionado: recursos_entregues JSONB (substitui tabela resource_tracking)

CREATE TABLE IF NOT EXISTS leads_processo (
    id                   SERIAL PRIMARY KEY,
    lead_id              INTEGER      NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

    -- Serviço contratado/negociado
    servico              VARCHAR(255),
    status_atendimento   VARCHAR(50),

    -- Reunião (reuniao_agendada = data_reuniao IS NOT NULL)
    data_reuniao         TIMESTAMPTZ,

    -- Procuração e-CAC
    procuracao           BOOLEAN      DEFAULT FALSE,
    procuracao_ativa     BOOLEAN      DEFAULT FALSE,
    procuracao_validade  DATE,

    -- Conversão
    cliente              BOOLEAN      DEFAULT FALSE,

    -- Atendimento humano
    atendente_id         VARCHAR(100),
    envio_disparo        VARCHAR(50),
    observacoes          TEXT,

    -- Controle temporal
    data_controle_24h    TIMESTAMPTZ,
    data_followup        TIMESTAMPTZ,

    -- Recursos entregues ao lead (vídeos, links, formulários)
    -- Estrutura: { "video-tutorial-procuracao-ecac": { delivered_at, accessed_at, status } }
    recursos_entregues   JSONB        DEFAULT '{}',

    -- Timestamps
    created_at           TIMESTAMPTZ  DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  DEFAULT NOW(),

    UNIQUE (lead_id)
);

CREATE INDEX IF NOT EXISTS idx_leads_processo_status    ON leads_processo(status_atendimento);
CREATE INDEX IF NOT EXISTS idx_leads_processo_reuniao   ON leads_processo(data_reuniao) WHERE data_reuniao IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_processo_followup  ON leads_processo(data_followup);
CREATE INDEX IF NOT EXISTS idx_leads_processo_procuracao ON leads_processo(procuracao_ativa) WHERE procuracao_ativa = TRUE;

-- ─── CHAT_HISTORY ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_history (
    id         SERIAL PRIMARY KEY,
    phone      VARCHAR(20)  NOT NULL,
    role       VARCHAR(15)  NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content    TEXT         NOT NULL,
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_phone      ON chat_history(phone);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

-- ─── INTERPRETER_MEMORIES ────────────────────────────────────────────────────
-- Removido: lead_id (nunca populado — coluna morta)

CREATE TABLE IF NOT EXISTS interpreter_memories (
    id         SERIAL PRIMARY KEY,
    phone      VARCHAR(20)  NOT NULL,
    content    TEXT         NOT NULL,
    category   VARCHAR(50),
    embedding  REAL[],
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interpreter_memories_phone ON interpreter_memories(phone);

-- ─── CONSULTAS_SERPRO ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS consultas_serpro (
    id           SERIAL PRIMARY KEY,
    cnpj         VARCHAR(20)  NOT NULL,
    tipo_servico VARCHAR(50)  NOT NULL,
    resultado    JSONB,
    status       INTEGER,
    source       VARCHAR(50),
    created_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultas_serpro_cnpj   ON consultas_serpro(cnpj);
CREATE INDEX IF NOT EXISTS idx_consultas_serpro_source ON consultas_serpro(source);

-- ─── SERPRO_DOCUMENTOS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS serpro_documentos (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj          VARCHAR(14)  NOT NULL,
    tipo_servico  VARCHAR(50)  NOT NULL,
    protocolo     VARCHAR(100),
    r2_key        TEXT         NOT NULL,
    r2_url        TEXT         NOT NULL,
    tamanho_bytes INTEGER,
    valido_ate    TIMESTAMPTZ,
    gerado_por    VARCHAR(20)  NOT NULL DEFAULT 'admin',
    lead_id       INTEGER      REFERENCES leads(id) ON DELETE SET NULL,
    metadata      JSONB,
    deletado_em   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_serpro_docs_cnpj   ON serpro_documentos(cnpj);
CREATE INDEX IF NOT EXISTS idx_serpro_docs_tipo   ON serpro_documentos(tipo_servico);
CREATE INDEX IF NOT EXISTS idx_serpro_docs_valido ON serpro_documentos(valido_ate) WHERE deletado_em IS NULL;

-- ─── DISPAROS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS disparos (
    id            SERIAL PRIMARY KEY,
    channel       VARCHAR(50)  NOT NULL,
    instance_name VARCHAR(100),
    body          TEXT         NOT NULL,
    filters       JSONB        NOT NULL DEFAULT '{}',
    stats         JSONB,
    schedule_at   TIMESTAMPTZ,
    status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disparo_logs (
    id          SERIAL PRIMARY KEY,
    disparo_id  INTEGER      NOT NULL REFERENCES disparos(id) ON DELETE CASCADE,
    phone       VARCHAR(20)  NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
    sent_at     TIMESTAMPTZ  DEFAULT NOW(),
    UNIQUE (disparo_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_disparo_logs_disparo ON disparo_logs(disparo_id);

-- ─── COLABORADORES ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS colaboradores (
    id         SERIAL PRIMARY KEY,
    nome       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) UNIQUE,
    telefone   VARCHAR(20)  UNIQUE,
    cargo      VARCHAR(100) NOT NULL DEFAULT 'Atendente',
    permissoes TEXT[]       DEFAULT '{}',
    senha_hash TEXT,
    ativo      BOOLEAN      DEFAULT TRUE,
    created_at TIMESTAMPTZ  DEFAULT NOW(),
    updated_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_colaboradores_ativo ON colaboradores(ativo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cargo ON colaboradores(cargo);

-- ─── SYSTEM_SETTINGS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS system_settings (
    key          VARCHAR(100) PRIMARY KEY,
    label        VARCHAR(255),
    type         VARCHAR(50),
    value        TEXT,
    allowed_bots TEXT[],
    updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ─── SERVICES ────────────────────────────────────────────────────────────────
-- Catálogo de serviços consultado pelo Apolo via searchServices()

CREATE TABLE IF NOT EXISTS services (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    value       VARCHAR(255),
    description TEXT,
    ativo       BOOLEAN      DEFAULT TRUE,
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_name ON services(name);

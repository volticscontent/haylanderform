-- Módulo Integra Contador — tabelas de plataforma fiscal multi-empresa

CREATE TABLE IF NOT EXISTS integra_config (
  id SERIAL PRIMARY KEY,
  ativo BOOLEAN DEFAULT true,
  consumer_key_override VARCHAR,
  consumer_secret_override VARCHAR,
  dia_execucao_mensal INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garante single-row
INSERT INTO integra_config DEFAULT VALUES
  ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS integra_empresas (
  id SERIAL PRIMARY KEY,
  cnpj VARCHAR(18) NOT NULL UNIQUE,
  razao_social VARCHAR NOT NULL,
  regime_tributario VARCHAR(20) DEFAULT 'mei',
  ativo BOOLEAN DEFAULT true,
  servicos_habilitados JSONB DEFAULT '[]',
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  certificado_validade DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integra_robos (
  id SERIAL PRIMARY KEY,
  tipo_robo VARCHAR(30) NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT false,
  dia_execucao INTEGER DEFAULT 20,
  hora_execucao TIME DEFAULT '08:00:00',
  ultima_execucao TIMESTAMPTZ,
  proxima_execucao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seeds dos 4 robôs padrão
INSERT INTO integra_robos (tipo_robo) VALUES
  ('pgmei'), ('pgdas'), ('cnd'), ('caixa_postal')
  ON CONFLICT (tipo_robo) DO NOTHING;

CREATE TABLE IF NOT EXISTS integra_execucoes (
  id SERIAL PRIMARY KEY,
  robo_tipo VARCHAR(30) NOT NULL,
  iniciado_em TIMESTAMPTZ DEFAULT NOW(),
  concluido_em TIMESTAMPTZ,
  status VARCHAR(15) DEFAULT 'running',
  total_empresas INTEGER DEFAULT 0,
  sucesso INTEGER DEFAULT 0,
  falhas INTEGER DEFAULT 0,
  ignoradas INTEGER DEFAULT 0,
  duracao_ms INTEGER
);

CREATE TABLE IF NOT EXISTS integra_execucao_itens (
  id SERIAL PRIMARY KEY,
  execucao_id INTEGER REFERENCES integra_execucoes(id) ON DELETE CASCADE,
  empresa_id INTEGER REFERENCES integra_empresas(id) ON DELETE CASCADE,
  status VARCHAR(10) DEFAULT 'pending',
  mensagem TEXT,
  dados_resposta JSONB,
  custo_estimado DECIMAL(10, 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integra_guias (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES integra_empresas(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL,
  competencia VARCHAR(6),
  valor DECIMAL(10, 2),
  vencimento DATE,
  status_pagamento VARCHAR(15) DEFAULT 'pendente',
  pdf_r2_key VARCHAR,
  codigo_barras VARCHAR,
  numero_documento VARCHAR,
  dados_originais JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integra_caixa_postal (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES integra_empresas(id) ON DELETE CASCADE,
  assunto VARCHAR,
  conteudo TEXT,
  data_mensagem TIMESTAMPTZ,
  lida BOOLEAN DEFAULT false,
  dados_originais JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_integra_empresas_cnpj ON integra_empresas(cnpj);
CREATE INDEX IF NOT EXISTS idx_integra_execucoes_robo ON integra_execucoes(robo_tipo, iniciado_em DESC);
CREATE INDEX IF NOT EXISTS idx_integra_guias_empresa ON integra_guias(empresa_id, competencia DESC);
CREATE INDEX IF NOT EXISTS idx_integra_caixa_empresa ON integra_caixa_postal(empresa_id, lida);

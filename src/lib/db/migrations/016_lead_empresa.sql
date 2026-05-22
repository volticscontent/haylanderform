-- 016 — Tabela relacional lead_empresa
-- Substitui cnpjs_adicionais JSONB (015) por tabela própria com procuração por empresa
-- cnpj_ativo migra para Redis (session:cnpj_ativo:{leadId}) — DB write removido

CREATE TABLE IF NOT EXISTS lead_empresa (
    id                  SERIAL PRIMARY KEY,
    lead_id             INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    cnpj                VARCHAR(18) NOT NULL,
    tipo_vinculo        VARCHAR(20) NOT NULL DEFAULT 'proprietario'
                        CHECK (tipo_vinculo IN ('proprietario', 'socio', 'representante')),
    razao_social        VARCHAR(255),
    tipo_negocio        VARCHAR(100),
    faturamento_mensal  VARCHAR(50),
    procuracao          BOOLEAN DEFAULT FALSE,
    procuracao_ativa    BOOLEAN DEFAULT FALSE,
    procuracao_validade DATE,
    tem_divida          BOOLEAN,
    valor_divida_pgfn   NUMERIC(12,2),
    valor_divida_municipal NUMERIC(12,2),
    valor_divida_estadual  NUMERIC(12,2),
    valor_divida_federal   NUMERIC(12,2),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (lead_id, cnpj)
);

CREATE INDEX IF NOT EXISTS idx_lead_empresa_lead_id ON lead_empresa(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_empresa_cnpj    ON lead_empresa(cnpj);

-- Migra dados existentes de leads.cnpjs_adicionais (formato {cnpj,tipo,razao_social})
-- Trata também o formato legado de string pura (antes da migration 015)
INSERT INTO lead_empresa (lead_id, cnpj, tipo_vinculo, razao_social)
SELECT
    l.id,
    CASE
        WHEN jsonb_typeof(elem) = 'string' THEN elem #>> '{}'
        ELSE REGEXP_REPLACE(elem->>'cnpj', '[^0-9]', '', 'g')
    END,
    COALESCE(
        NULLIF(
            CASE WHEN jsonb_typeof(elem) = 'object' THEN elem->>'tipo' ELSE NULL END,
            ''
        ),
        'proprietario'
    ),
    CASE WHEN jsonb_typeof(elem) = 'object' THEN elem->>'razao_social' ELSE NULL END
FROM leads l,
     jsonb_array_elements(COALESCE(l.cnpjs_adicionais, '[]'::jsonb)) AS elem
WHERE l.cnpjs_adicionais IS NOT NULL
  AND l.cnpjs_adicionais != '[]'::jsonb
ON CONFLICT (lead_id, cnpj) DO NOTHING;

-- Remove colunas migradas
ALTER TABLE leads DROP COLUMN IF EXISTS cnpjs_adicionais;
ALTER TABLE leads DROP COLUMN IF EXISTS cnpj_ativo;

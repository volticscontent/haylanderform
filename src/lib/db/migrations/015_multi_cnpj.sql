-- 015 — Multi-empresa: cnpj_ativo e cnpjs_adicionais na tabela leads
-- cnpj         = empresa principal (já existe)
-- cnpj_ativo   = CNPJ em foco no atendimento atual (overrides principal)
-- cnpjs_adicionais = array JSON de CNPJs extras cadastrados pelo bot

ALTER TABLE leads ADD COLUMN IF NOT EXISTS cnpj_ativo      VARCHAR(18);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cnpjs_adicionais JSONB DEFAULT '[]'::jsonb;

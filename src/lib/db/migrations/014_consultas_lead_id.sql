-- 014 — Adiciona lead_id a consultas_serpro para rastreabilidade
-- Motivo: consultas_serpro armazenava apenas cnpj (varchar solto), sem FK.
-- Com lead_id nullable, toda consulta pode ser associada ao lead que a originou.
-- Backfill automático por match de CNPJ.

ALTER TABLE consultas_serpro
    ADD COLUMN IF NOT EXISTS lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL;

-- Backfill: vincular consultas a leads por CNPJ
-- DISTINCT ON lead por CNPJ para evitar ambiguidade quando múltiplos leads
-- compartilham CNPJ (situação de dados ruins, mas existente)
UPDATE consultas_serpro cs
SET lead_id = sub.lead_id
FROM (
    SELECT DISTINCT ON (REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g'))
        id AS lead_id,
        REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g') AS cnpj_clean
    FROM leads
    WHERE cnpj IS NOT NULL AND cnpj != ''
    ORDER BY REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g'), id ASC
) sub
WHERE cs.cnpj = sub.cnpj_clean
  AND cs.lead_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_consultas_serpro_lead ON consultas_serpro(lead_id)
    WHERE lead_id IS NOT NULL;

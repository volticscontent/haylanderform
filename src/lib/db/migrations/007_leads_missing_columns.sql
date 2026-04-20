-- Migração: Colunas ausentes na tabela leads
-- Estas colunas são usadas no código (server-tools.ts) mas nunca foram formalmente migradas.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS needs_attendant BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS attendant_requested_at TIMESTAMPTZ;

-- Índice para o painel admin buscar leads que precisam de atendimento humano
CREATE INDEX IF NOT EXISTS idx_leads_needs_attendant ON leads(needs_attendant) WHERE needs_attendant = TRUE;

-- 013 — Histórico de procurações (audit trail)
-- Motivo: 3 booleans em leads_processo não permitem saber quando, quem e quantas vezes
-- a procuração foi ativada/desativada. Esta tabela registra cada evento.

CREATE TABLE IF NOT EXISTS leads_procuracao_historico (
    id          SERIAL PRIMARY KEY,
    lead_id     INTEGER      NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    ativo       BOOLEAN      NOT NULL,            -- TRUE = ativada, FALSE = desativada
    validade    DATE,                             -- Data de expiração informada
    protocolo   VARCHAR(100),                    -- Protocolo Serpro quando disponível
    operador    VARCHAR(100),                    -- atendente_id responsável pela ação
    origem      VARCHAR(20)  DEFAULT 'admin',    -- admin | bot | migration
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proc_hist_lead ON leads_procuracao_historico(lead_id, created_at DESC);

-- Seed: registrar o estado atual como primeiro evento histórico
-- Marca origem='migration' para distinguir de ações reais
INSERT INTO leads_procuracao_historico (lead_id, ativo, validade, origem)
SELECT
    lp.lead_id,
    COALESCE(lp.procuracao_ativa, FALSE),
    lp.procuracao_validade,
    'migration'
FROM leads_processo lp
WHERE lp.procuracao = TRUE OR lp.procuracao_ativa = TRUE;

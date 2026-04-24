-- 012 — Denormaliza `cliente` de leads_processo → leads
-- Motivo: evitar JOIN obrigatório toda vez que precisamos saber se o lead é cliente.
-- Fonte de verdade permanece em leads_processo.cliente; leads.cliente é espelho via trigger.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS cliente BOOLEAN DEFAULT FALSE;

-- Backfill: estado atual de leads_processo
UPDATE leads l
SET cliente = lp.cliente
FROM leads_processo lp
WHERE l.id = lp.lead_id;

-- Índice parcial — queries de clientes não varrem a tabela inteira
CREATE INDEX IF NOT EXISTS idx_leads_cliente ON leads(cliente) WHERE cliente = TRUE;

-- Trigger que mantém leads.cliente sincronizado automaticamente
CREATE OR REPLACE FUNCTION fn_sync_cliente_to_leads()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE leads SET cliente = NEW.cliente WHERE id = NEW.lead_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_cliente_leads ON leads_processo;
CREATE TRIGGER trg_sync_cliente_leads
    AFTER INSERT OR UPDATE OF cliente ON leads_processo
    FOR EACH ROW EXECUTE FUNCTION fn_sync_cliente_to_leads();

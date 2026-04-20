-- Adiciona constraint UNIQUE para permitir UPSERT em resource_tracking
-- Necessário para markProcuracaoCompleted usar ON CONFLICT em vez de UPDATE silencioso
ALTER TABLE resource_tracking
  ADD CONSTRAINT IF NOT EXISTS uq_resource_tracking_lead_type_key
  UNIQUE (lead_id, resource_type, resource_key);

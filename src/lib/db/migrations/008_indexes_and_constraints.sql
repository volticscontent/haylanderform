-- Migração: Índices faltantes e relaxamento de constraints

-- 1. Índice em consultas_serpro(source) — filtrado por source='admin' e source='bot' nas queries
CREATE INDEX IF NOT EXISTS idx_consultas_serpro_source ON consultas_serpro(source);

-- 2. Relaxar CHECK de resource_tracking.resource_type
--    O CHECK original só permitia 4 valores fixos. Substituímos por um VARCHAR livre
--    para suportar novos tipos (ex: 'das-mei', 'cnd') sem futuras migrations de ALTER.
ALTER TABLE resource_tracking DROP CONSTRAINT IF EXISTS resource_tracking_resource_type_check;

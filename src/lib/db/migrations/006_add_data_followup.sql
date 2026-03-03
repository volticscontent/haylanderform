-- Migração: Adicionar coluna data_followup à tabela leads_atendimento
-- Usada pelo CRON de follow-up de inatividade para controlar última data de contato automático
ALTER TABLE leads_atendimento ADD COLUMN IF NOT EXISTS data_followup TIMESTAMP;

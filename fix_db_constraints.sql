-- Plano de Correção de Constraints e Campos para IA
-- Rode este script no seu banco de dados PostgreSQL

-- 1. Atualizar opções de situação permitidas na tabela leads_qualificacao
ALTER TABLE leads_qualificacao DROP CONSTRAINT IF EXISTS leads_qualificacao_situacao_check;
ALTER TABLE leads_qualificacao ADD CONSTRAINT leads_qualificacao_situacao_check 
CHECK (situacao IN ('nao_respondido', 'desqualificado', 'qualificado', 'cliente', 'atendimento_humano', 'Ativo'));

-- 2. Adicionar campo 'sexo' na tabela leads para triagem da IA
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sexo VARCHAR(20);

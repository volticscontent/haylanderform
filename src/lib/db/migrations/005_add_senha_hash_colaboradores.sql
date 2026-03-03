-- Migração: Adicionar coluna senha_hash à tabela colaboradores
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);

-- Email agora é obrigatório para login
ALTER TABLE colaboradores ALTER COLUMN email SET NOT NULL;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS needs_attendant BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS attendant_requested_at TIMESTAMP WITH TIME ZONE;

-- Assumindo que a tabela services já existe e tem a coluna 'nome'
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_info VARCHAR(255);
ALTER TABLE services ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Adicionando dados com a sintaxe para 'nome' (em português) em vez de 'name', pois a tabela real parece ter essa estrutura.
-- Tentaremos primeiro descobrir se tem column nome e tentar inserir lá
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_nome_key') THEN
        ALTER TABLE services ADD CONSTRAINT services_nome_key UNIQUE (nome);
    END IF;
END $$;

INSERT INTO services (nome, descricao, price_info) VALUES
('Abertura de Empresa (MEI, ME, EPP)', 'Abertura rápida e segura de empresas, desde MEI até empresas de médio porte estruturadas.', 'Sob consulta'),
('Migração de MEI para ME', 'Desenquadramento do MEI e transição segura para Microempresa, ideal para quem estourou o faturamento.', 'Sob consulta'),
('Contabilidade Digital Completa', 'Gestão contábil, fiscal e folha de pagamento 100% digital e sem burocracia.', 'A partir de R$ 197/mês'),
('BPO Financeiro', 'Terceirização do setor financeiro: contas a pagar/receber, conciliação bancária e emissão de notas.', 'Sob consulta'),
('Regularização de Pendências (Receita Federal)', 'Resolução de CNPJ Inapto, dívidas ativas, e pendências fiscais federais, estaduais e municipais.', 'Sob consulta'),
('Imposto de Renda (PF e PJ)', 'Declaração anual de imposto de renda para pessoas físicas e jurídicas.', 'Sob consulta'),
('Folha de Pagamento e Pro-labore', 'Gestão de admissões, demissões, férias, décimo terceiro e emissão de pro-labore dos sócios.', 'Sob consulta'),
('Certificado Digital', 'Emissão e renovação de certificado digital (e-CPF e e-CNPJ) online ou presencial.', 'A partir de R$ 99')
ON CONFLICT (nome) DO NOTHING;

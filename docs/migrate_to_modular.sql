
-- Migrate Business Info
INSERT INTO leads_empresarial (
    lead_id, cnpj, razao_social, nome_fantasia, tipo_negocio, 
    faturamento_mensal, endereco, numero, complemento, 
    bairro, cidade, estado, cep, dados_serpro, cartao_cnpj
)
SELECT 
    id, cnpj, razao_social, nome_fantasia, tipo_negocio,
    faturamento_mensal, endereco, numero, complemento,
    bairro, cidade, estado, cep, dados_serpro, cartao_cnpj
FROM leads
ON CONFLICT (lead_id) DO UPDATE SET
    cnpj = EXCLUDED.cnpj,
    razao_social = EXCLUDED.razao_social,
    nome_fantasia = EXCLUDED.nome_fantasia,
    tipo_negocio = EXCLUDED.tipo_negocio,
    faturamento_mensal = EXCLUDED.faturamento_mensal,
    endereco = EXCLUDED.endereco,
    numero = EXCLUDED.numero,
    complemento = EXCLUDED.complemento,
    bairro = EXCLUDED.bairro,
    cidade = EXCLUDED.cidade,
    estado = EXCLUDED.estado,
    cep = EXCLUDED.cep,
    dados_serpro = EXCLUDED.dados_serpro,
    cartao_cnpj = EXCLUDED.cartao_cnpj,
    updated_at = NOW();

-- Migrate Qualification Info
INSERT INTO leads_qualificacao (
    lead_id, situacao, qualificacao, motivo_qualificacao,
    interesse_ajuda, pos_qualificacao, possui_socio
)
SELECT 
    id, situacao, qualificacao, motivo_qualificacao,
    interesse_ajuda, pos_qualificacao, possui_socio
FROM leads
ON CONFLICT (lead_id) DO UPDATE SET
    situacao = EXCLUDED.situacao,
    qualificacao = EXCLUDED.qualificacao,
    motivo_qualificacao = EXCLUDED.motivo_qualificacao,
    interesse_ajuda = EXCLUDED.interesse_ajuda,
    pos_qualificacao = EXCLUDED.pos_qualificacao,
    possui_socio = EXCLUDED.possui_socio,
    updated_at = NOW();

-- Migrate Financial Info
INSERT INTO leads_financeiro (
    lead_id, tem_divida, tipo_divida, 
    valor_divida_municipal, valor_divida_estadual, 
    valor_divida_federal, valor_divida_ativa, 
    tempo_divida, calculo_parcelamento
)
SELECT 
    id, tem_divida, tipo_divida,
    NULLIF(valor_divida_municipal, '')::numeric, 
    NULLIF(valor_divida_estadual, '')::numeric,
    NULLIF(valor_divida_federal, '')::numeric,
    NULLIF(valor_divida_ativa, '')::numeric,
    tempo_divida, calculo_parcelamento
FROM leads
ON CONFLICT (lead_id) DO UPDATE SET
    tem_divida = EXCLUDED.tem_divida,
    tipo_divida = EXCLUDED.tipo_divida,
    valor_divida_municipal = EXCLUDED.valor_divida_municipal,
    valor_divida_estadual = EXCLUDED.valor_divida_estadual,
    valor_divida_federal = EXCLUDED.valor_divida_federal,
    valor_divida_ativa = EXCLUDED.valor_divida_ativa,
    tempo_divida = EXCLUDED.tempo_divida,
    calculo_parcelamento = EXCLUDED.calculo_parcelamento,
    updated_at = NOW();

-- Migrate Sales Info
INSERT INTO leads_vendas (
    lead_id, servico_negociado, status_atendimento, 
    data_reuniao, procuracao, procuracao_ativa, procuracao_validade
)
SELECT 
    id, servico_negociado, status_atendimento,
    data_reuniao, procuracao, procuracao_ativa, procuracao_validade
FROM leads
ON CONFLICT (lead_id) DO UPDATE SET
    servico_negociado = EXCLUDED.servico_negociado,
    status_atendimento = EXCLUDED.status_atendimento,
    data_reuniao = EXCLUDED.data_reuniao,
    procuracao = EXCLUDED.procuracao,
    procuracao_ativa = EXCLUDED.procuracao_ativa,
    procuracao_validade = EXCLUDED.procuracao_validade,
    updated_at = NOW();

-- Migrate Attendant Info
INSERT INTO leads_atendimento (
    lead_id, atendente_id, envio_disparo, 
    data_controle_24h, data_ultima_consulta, observacoes
)
SELECT 
    id, atendente_id, envio_disparo,
    data_controle_24h, data_ultima_consulta, observacoes
FROM leads
ON CONFLICT (lead_id) DO UPDATE SET
    atendente_id = EXCLUDED.atendente_id,
    envio_disparo = EXCLUDED.envio_disparo,
    data_controle_24h = EXCLUDED.data_controle_24h,
    data_ultima_consulta = EXCLUDED.data_ultima_consulta,
    observacoes = EXCLUDED.observacoes,
    updated_at = NOW();

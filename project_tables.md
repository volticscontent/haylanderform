# Estrutura de Banco de Dados do Projeto

O banco de dados do Haylander está estruturado em torno da entidade principal `leads`, que armazena os dados básicos de contato do usuário. As informações adicionais são normalizadas em várias tabelas estendidas (relacionadas de 1 para 1 com `leads`) para manter a organização e escalabilidade do banco de dados.

## Tabelas Principais

### 1. `leads`
Tabela raiz (mãe) que armazena os dados essenciais e de contato do lead.
- **Campos Principais**: `id`, `telefone`, `nome_completo`, `email`, `cpf`, `data_nascimento`, `nome_mae`, `senha_gov`, `data_cadastro`, `atualizado_em`.
- **Propósito**: Identificar usuários, validar contatos e integrar com o WhatsApp.

### 2. `leads_empresarial`
Dados da empresa (CNPJ) associados ao lead.
- **Relacionamento**: `lead_id`
- **Campos Principais**: `cnpj`, `razao_social`, `nome_fantasia`, `tipo_negocio`, `faturamento_mensal`, `cartao_cnpj`, `dados_serpro` (JSON), dados de endereço (`endereco`, `bairro`, `cidade`, `estado`, `cep`).
- **Propósito**: Armazenar informações extraídas do Serpro e dados empresariais preenchidos no formulário ou captura do bot.

### 3. `leads_qualificacao`
Métricas e status de qualificação do lead pelo bot/MQL.
- **Relacionamento**: `lead_id`
| Campo | Descrição |
|---|---|
| `situacao` | (ex: qualificado, cliente) |
| `qualificacao` | (MQL, SQL, ICP) |
| `motivo_qualificacao`| Por que foi classificado assim |
| `interesse_ajuda`    | Se tem interesse |
| `pos_qualificacao`   | Flag boolean pós atendimento |
| `possui_socio`       | Boolean |
| `confirmacao_qualificacao` | Boolean - Confirmação do ICP/MQL |
- **Propósito**: Separar os leads bons dos ruins para otimizar o time de vendas.

### 4. `leads_financeiro`
Armazena dados das dívidas e parcelamentos.

| Campo | Descrição |
|-------|-----------|
| `tem_divida` | Boolean indicando se possui |
| `tipo_divida` | municipal, estadual, federal, ativa, etc |
| `valor_divida_*` | Campos numéricos específicos (municipal, estadual, federal, ativa) |
| `tempo_divida` | Texto indicando a idade da dívida |
| `calculo_parcelamento`| Texto grande (observação do consultor simulando parcelas) |
- **Propósito**: Direcionamento das negociações de valores de débitos federais/municipais.

### 5. `leads_vendas`
Armazena dados do fechamento ou negociação.

| Campo | Descrição |
|-------|-----------|
| `servico_negociado` | Texto (ex: "Regularização MEI") |
| `servico_escolhido` | Texto (serviço efetivamente escolhido) |
| `status_atendimento`| Status atual do envio/venda |
| `data_reuniao`      | Data agendada para call |
| `reuniao_agendada`  | Boolean (sim/não agendado) |
| `vendido`           | Boolean (sim/não vendido) |
| `procuracao`        | Se já mandou/assinou procuração |
| `procuracao_ativa`  | Status boolean |
| `procuracao_validade`| Data validade |
- **Propósito**: Focar a equipe de vendas em negociações ativas e controlar status da procuração.

### 6. `leads_atendimento`
Histórico e controle da operação de atendimento.
- **Relacionamento**: `lead_id`
- **Campos Principais**: `atendente_id`, `envio_disparo`, `data_controle_24h`, `data_ultima_consulta`, `observacoes`.
- **Propósito**: Contexto de atendimento, transbordo humano, observações dos vendedores e tracking do bot de 24h.

## Tabelas Auxiliares

### `consultas_serpro`
Tabela de log e cache.
- **Campos Principais**: `id`, `cnpj`, `tipo_servico`, `resultado`, `status`.
- **Propósito**: Impedir chamadas duplicadas na API do Serpro para o mesmo CNPJ minimizando custos.

### `disparos`
Tabela para controle de envio em massa inteligente.
- **Campos Principais**: `id`, `channel`, `body`, `status` (draft, preview, scheduled, etc), `schedule_at`, `filters`.
- **Propósito**: Realizar campanhas direcionadas segmentando as tabelas principais.

### Tabelas da Evolution (Integração WhatsApp Webhook)
Para funcionamento interno, também podemos acessar tabelas preenchidas diretamente pelo Postgres da Evolution API:
- `Instance`, `Contact`, `Chat`, `Message`
- **Propósito**: Puxar histórico de mensagens raiz, contagem de unread messages e extração correta de JIDs.

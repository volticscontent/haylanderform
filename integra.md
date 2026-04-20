# Pesquisa & Escopo de Projeto — Módulo Integra Contador

## Sumário Executivo

Este documento consolida a pesquisa sobre a **API Integra Contador do Serpro** e como o **Calima ERP** construiu seu módulo em cima dessa API, servindo como referência para construir um módulo equivalente no nosso sistema.

**Plano de execução:** `docs/plan.master.integra.md`

---

## PARTE 0 — Estado Atual da Nossa Implementação

### O que já existe no `bot-backend`

| Arquivo | Responsabilidade | Status |
|---------|-----------------|--------|
| `src/lib/serpro.ts` | mTLS, autenticação OAuth, `consultarServico()`, `getSerproTokens()` | ✅ Funcional |
| `src/lib/serpro-config.ts` | `SERVICE_CONFIG` com 20+ serviços mapeados (PGMEI, PGFN, SITFIS, CND, etc.) | ✅ Completo |
| `src/lib/serpro-types.ts` | DTOs: `SerproPayload`, `SerproParte`, `SerproTokens`, `SerproOptions` | ✅ Completo |
| `src/lib/serpro-db.ts` | Persistência de consultas em `consultas_serpro`, documentos no R2 | ✅ Funcional |
| `src/routes/serpro-api.ts` | REST API admin: `POST /serpro`, `GET /serpro/clients`, histórico, documentos | ✅ Funcional |
| `src/ai/agents/apolo/workflow-regularizacao.ts` | Tools do bot: `consultar_pgmei_serpro`, `consultar_divida_ativa_serpro`, gate de procuração | ✅ Funcional |

### Gaps em relação ao modelo Calima

| Funcionalidade | Calima | Nós |
|----------------|--------|-----|
| Gestão multi-empresa habilitada | ✅ | ❌ Single-tenant |
| Certificados por empresa | ✅ | ❌ Um certificado global |
| Robôs agendados (BullMQ) | ✅ | ❌ Apenas invocação manual/bot |
| Dashboard de guias e status | ✅ | ❌ Ausente |
| Caixa Postal automatizada | ✅ | ❌ Ausente |
| Billing tracker / consumo | ✅ | ❌ Ausente |
| Telas operacionais (PGDAS, DCTFWeb, PGMEI) | ✅ | ❌ Apenas via API direta |

### Decisão de Arquitetura
Dado que operamos como **escritório contábil único** (não software-house), o modelo de acesso é sempre **Contador com Procuração** — `contratante = autorPedidoDados = CNPJ da Haylander`. O certificado A1 global continua sendo o único necessário nesta fase. O suporte a credenciais individuais por empresa (modelo software-house) é backlog de longo prazo.

---

---

## PARTE 1 — A API Integra Contador (Serpro / Receita Federal)

### 1.1 O que é

A plataforma Integra Contador é um conjunto de APIs criado pela Receita Federal em parceria com o Serpro. Ela substitui o acesso robotizado ao e-CAC, oferecendo um canal oficial, seguro e em conformidade com a LGPD para que contadores e software-houses acessem dados fiscais dos contribuintes de forma massiva e automatizada.

A plataforma já conta com **87+ serviços** organizados em catálogo, cobrindo desde Simples Nacional até DCTFWeb, MIT, FGTS Digital, Caixa Postal da Receita, CND, entre outros.

### 1.2 Modelo de Contratação e Cobrança

- **Contratação**: Feita na Loja Serpro (gratuita para aderir à plataforma).
- **Credenciais recebidas**: `Consumer Key` e `Consumer Secret`.
- **Certificado digital**: Obrigatório e-CNPJ do tipo A1 (A3 não é suportado).
- **Cobrança**: Pós-paga por faixa de consumo mensal. Quanto maior o volume, menor o custo unitário.
- **Categorias de cobrança**: Consultas, Emissões e Declarações — cada uma com sua própria tabela de preços.
- **Exemplo de custo (Simples Nacional)**: ~R$0,96 por empresa/mês (3 chamadas: declaração R$0,40 + consulta + emissão).

### 1.3 Arquitetura da API

**Base URL (Produção):** `https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/`

**Endpoints organizados por tipo de ação:**

| Tipo | URL Path | Descrição |
|------|----------|-----------|
| Apoiar | `/Apoiar` | Serviços auxiliares (autenticação de procurador, etc.) |
| Consultar | `/Consultar` | Consultas de dados fiscais |
| Declarar | `/Declarar` | Transmissão de declarações |
| Emitir | `/Emitir` | Emissão de guias (DAS, DARF) e comprovantes |
| Monitorar | `/Monitorar` | Monitoramento de status |

### 1.4 Fluxo de Autenticação

**Passo 1 — Obter Bearer Token + JWT:**

```
POST https://autenticacao.sapi.serpro.gov.br/authenticate
Headers:
  Authorization: Basic <base64(consumer_key:consumer_secret)>
  Role-Type: TERCEIROS
  Content-Type: application/x-www-form-urlencoded
Body: grant_type=client_credentials
TLS Client Certificate: arquivo_certificado.p12
```

**Resposta**: Retorna `access_token` (Bearer) e `jwt_token` temporários.

**Passo 2 — Chamar a API com os tokens:**

```
POST https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/Consultar
Headers:
  Authorization: Bearer <access_token>
  jwt_token: <jwt_token>
  Content-Type: application/json
```

**Nota**: Quando o token expira, a API retorna HTTP 401 e é necessário re-autenticar.

### 1.5 Estrutura Padrão do Body (Pedido de Dados)

Todas as chamadas seguem exatamente o mesmo JSON envelope:

```json
{
  "contratante": {
    "numero": "CNPJ_DA_SOFTWARE_HOUSE_OU_CONTADOR",
    "tipo": 2
  },
  "autorPedidoDados": {
    "numero": "CNPJ_DO_PROCURADOR_OU_CONTADOR",
    "tipo": 2
  },
  "contribuinte": {
    "numero": "CNPJ_DA_EMPRESA_CLIENTE",
    "tipo": 2
  },
  "pedidoDados": {
    "idSistema": "PGDASD",
    "idServico": "CONSEXTRATO16",
    "versaoSistema": "1.0",
    "dados": "{\"numeroDas\": \"99999999999999999\"}"
  }
}
```

**Campos-chave:**

- `contratante`: Quem contratou a API na loja Serpro (pode ser o próprio contador ou uma software-house).
- `autorPedidoDados`: O procurador ou outorgado que tem permissão legal de acessar os dados do contribuinte.
- `contribuinte`: A empresa cliente cujos dados estão sendo acessados.
- `pedidoDados.idSistema`: Identifica o sistema (PGDASD, DCTFWEB, PGMEI, CAIXAPOSTAL, PARCSN, PARCMEI, EPROCESSO, SICALC, SITFIS, MIT, etc.).
- `pedidoDados.idServico`: Identifica o serviço específico dentro do sistema.
- `pedidoDados.dados`: Parâmetros específicos do serviço, em formato JSON stringificado.

### 1.6 Dois Modelos de Acesso

**Modelo 1 — Contador com Procuração:**
- O contador contrata diretamente na Loja Serpro.
- Tem procuração eletrônica no e-CAC para atuar em nome dos clientes.
- Usa suas próprias Consumer Key/Secret para tudo.
- `contratante` = `autorPedidoDados` = CNPJ do contador.

**Modelo 2 — Software-House (Terceiros):**
- A software-house contrata a API mas **não tem** procuração.
- Precisa do **Autenticação Procurador**: um XML assinado digitalmente pelo certificado do procurador (contador), enviado via serviço auxiliar `/Apoiar`.
- `contratante` = CNPJ da software-house.
- `autorPedidoDados` = CNPJ do contador/procurador.
- O header `Role-Type: TERCEIROS` é usado na autenticação.

### 1.7 Catálogo de Serviços (Principais idSistema)

| idSistema | Serviços Principais |
|-----------|-------------------|
| PGDASD | Entrega PGDAS, Consulta extrato DAS, Gera DAS, DAS Avulso, DAS Cobrança |
| DCTFWEB | Transmissão DCTFWeb, Consulta DARF, Emissão DARF, Consulta Recibo |
| PGMEI | Geração DAS-MEI, Consulta pagamentos MEI |
| MIT | Encerrar/Consultar apuração MIT |
| CAIXAPOSTAL | Consulta mensagens da Receita Federal por contribuinte |
| SITFIS | Relatório de Situação Fiscal |
| CND | Certidão Negativa de Débitos |
| SICALC | Cálculo e emissão de guias de impostos |
| PARCSN | Parcelamento Simples Nacional |
| PARCMEI | Parcelamento MEI |
| DEFIS | Declaração de Informações Socioeconômicas e Fiscais |
| EPROCESSO | Consulta de processos eletrônicos |
| ECONSIGNADO | Consulta de empréstimos por procuração |

---

## PARTE 2 — Como o Calima ERP Implementou o Módulo

### 2.1 Visão Geral da Abordagem do Calima

O Calima é um ERP contábil na nuvem (SaaS, acesso via `calima.app`) que adicionou o módulo Integra Contador como feature premium do plano "Calima Pro". A filosofia deles é: o contador não precisa sair do Calima para nada — tudo que antes exigia login no e-CAC agora aparece dentro do sistema.

### 2.2 Estrutura do Frontend (Módulo Integra Contador)

Baseado na documentação e demonstrações, o módulo do Calima se organiza em:

**Menu Principal — Manutenção:**
- **Empresas**: Tela de listagem com toggle para ativar/desativar cada empresa no Integra. Exibe nome, validade do certificado digital e status. Clicando na engrenagem de cada empresa, abre configuração individual (tipo de acesso, certificado, serviços habilitados).
- **Configuração Geral**: Upload de certificado A1, campos para Consumer Key/Secret, configuração da automatização dos robôs (scheduler por serviço).

**Menu Principal — Processos:**
- **PGDAS**: Tela para entrega e consulta do PGDAS, geração de DAS. Interface mostra lista de empresas com status de cada uma.
- **DCTFWeb / DARF**: Transmissão e consulta de DCTFWeb, geração de DARF.
- **PGMEI / CCMEI**: Geração de DAS-MEI e consulta de pagamentos.
- **SICALC**: Geração de guias por código de receita.
- **SITFIS**: Relatório de Situação Fiscal.
- **CND**: Consulta e download de certidões negativas.
- **Parcelamentos**: Consulta e geração de guias de parcelamento SN/MEI.

**Menu Principal — Informativo:**
- **Caixa Postal**: Mensagens da Receita Federal, organizadas por empresa.
- **Dashboard Interativo**: Painel consolidado com gráficos de barras horizontais mostrando status geral (guias geradas, pendentes, vencidas). Clicável — ao clicar numa barra, redireciona para a tela de detalhe com filtro já aplicado.
- **Relatório de Detalhamento de Cobrança**: Mostra consumo por usuário e estimativa do valor a ser cobrado pelo Serpro.

### 2.3 Sistema de Robôs (Automação em Background)

Esta é a feature mais valiosa e o grande diferencial competitivo. O Calima implementou um sistema de jobs agendados:

**Como funciona:**
1. Na tela de Configuração Geral, o contador ativa/desativa cada robô individualmente.
2. Para cada robô, configura o **dia do mês** em que deve rodar automaticamente.
3. O Calima já traz datas padrão alinhadas com os prazos legais.
4. Quando o robô é executado, ele percorre **todas as empresas habilitadas** para aquele serviço e executa as chamadas à API do Serpro em lote.

**Robôs disponíveis no Calima:**

| Robô | O que faz |
|------|----------|
| PGDAS automático | Envia faturamento, busca DAS, recibo e declaração |
| DEFIS automática | Entrega anual da DEFIS |
| PGMEI automático | Baixa guia DAS-MEI |
| CCMEI automático | Consulta e emissão do CCMEI |
| DCTFWeb automática | Transmite DCTFWeb e gera DARF |
| DCTFWeb 13º | Gera DARF de 13º (só em dezembro) |
| MIT automático | Entrega automática do MIT |
| Parcelamento SN/MEI | Consulta e gera guias de parcelas |
| Consulta pagamentos | Verifica status de pagamento das guias |
| CND automática | Consulta CND por agendamento mensal ou por vencimento |

**Comportamento inteligente:**
- Se um PGDAS já foi entregue manualmente pelo portal, o robô ignora aquela empresa (não retifica).
- Se uma guia está vencida, gera nova DAS com atualização.
- Sempre que uma ação gera cobrança no Serpro, o sistema exibe um ícone "$" de alerta.

### 2.4 Gestão Multi-Cliente (Como Gerencia Vários Clientes)

**Arquitetura de dados inferida:**

```
Administradora (Escritório Contábil)
  └── Certificado Digital A1 do escritório
  └── Consumer Key / Consumer Secret (do contrato Serpro)
  └── Empresas Clientes (N empresas)
       └── Empresa 1
       │    ├── CNPJ
       │    ├── Status Integra: Ativo/Inativo
       │    ├── Tipo Acesso: "Procuração" ou "Contratação Própria"
       │    ├── Certificado Digital A1 (se contratação própria)
       │    ├── Consumer Key/Secret individuais (se contratação própria)
       │    ├── Serviços habilitados: [PGDAS, DCTFWEB, SITFIS, ...]
       │    └── Tributação: Simples Nacional / Lucro Presumido / MEI
       └── Empresa 2
       └── ...
```

**Dois cenários de credenciais:**

1. **Acesso por Procuração**: As chaves Consumer Key/Secret são únicas para o escritório. Configuradas **uma vez** nas Configurações Gerais. Procuração eletrônica precisa estar ativa no e-CAC.

2. **Acesso por Contratação do Cliente**: O próprio cliente contratou o Serpro e fornece suas chaves ao contador. Cada empresa tem suas próprias Consumer Key/Secret configuradas individualmente na tela de empresas.

**Habilitação automática de serviços:**
- Se a empresa é Simples Nacional → habilita PGDAS automaticamente.
- Se a empresa é MEI → habilita PGMEI automaticamente.
- Lucro Presumido/Real → habilita SITFIS, CND, Caixa Postal, SICALC.

### 2.5 Backend — Engenharia Reversa da Arquitetura Provável

Com base nas funcionalidades observadas, o backend do Calima para o Integra Contador provavelmente opera assim:

```
┌─────────────────────────────────────────────────┐
│                 CALIMA CLOUD (SaaS)              │
│                                                  │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Frontend  │  │   API REST   │  │  Scheduler │ │
│  │ (React/   │→ │   Backend    │← │  (Cron /   │ │
│  │  Angular) │  │  (Node/Java) │  │  BullMQ)   │ │
│  └──────────┘  └──────┬───────┘  └─────┬──────┘ │
│                       │                │         │
│              ┌────────▼────────┐       │         │
│              │  Módulo Serpro   │←──────┘         │
│              │  Integration    │                  │
│              │  Layer          │                  │
│              └────────┬───────┘                  │
│                       │                           │
│    ┌──────────────────▼──────────────────┐       │
│    │           Banco de Dados            │       │
│    │  - Empresas + Config Integra        │       │
│    │  - Certificados (A1 criptografado)  │       │
│    │  - Resultados das consultas         │       │
│    │  - Guias geradas (PDF base64)       │       │
│    │  - Logs de consumo / billing        │       │
│    │  - Mensagens Caixa Postal           │       │
│    │  - Status de cada job executado     │       │
│    └─────────────────────────────────────┘       │
│                       │                           │
└───────────────────────┼───────────────────────────┘
                        │
              ┌─────────▼─────────┐
              │   Serpro Gateway   │
              │  (mTLS + Bearer)  │
              └───────────────────┘
```

**Camada de Integração com Serpro (componentes-chave):**

1. **Token Manager**: Cache de tokens OAuth. Re-autentica automaticamente quando recebe 401. Gerencia tokens por contrato (escritório ou empresa individual).

2. **Certificate Store**: Armazena certificados A1 (.pfx/.p12) criptografados no banco. Na hora da chamada, carrega em memória para fazer mTLS.

3. **Request Builder**: Monta o JSON padrão do Serpro, preenchendo contratante/autorPedidoDados/contribuinte com base na empresa e tipo de acesso.

4. **Queue / Job Processor**: Quando o robô dispara, enfileira um job para cada empresa habilitada. Processa com concorrência controlada (para não estourar rate limits do Serpro). Registra resultado de cada job.

5. **Response Parser**: Interpreta as respostas do Serpro (que vêm em JSON com dados stringificados). Extrai PDFs em base64 (DAS, DARF, recibos). Persiste no banco.

6. **Billing Tracker**: Contabiliza cada chamada que gera cobrança. Alimenta o dashboard e o relatório de detalhamento de cobrança.

---

## PARTE 3 — Como a Alterdata/Domínio e Outros Fazem

### 3.1 Modelo Alterdata (Referência de Software-House Grande)

A Alterdata opera como **revendedora** do Integra Contador, usando seu alto volume para se enquadrar na última faixa de consumo do Serpro, oferecendo preço menor aos seus clientes. O contador contrata o Integra Contador **dentro** do sistema Alterdata (não direto no Serpro). A Alterdata atua como `contratante` na API e gerencia a bilhetagem internamente.

### 3.2 Modelo SCI Sistemas

A SCI não cobra pela integração — oferece como diferencial gratuito. O contador contrata diretamente no Serpro e cadastra suas chaves no sistema SCI.

---

## PARTE 4 — Escopo do Projeto Para o Seu Sistema

### 4.1 Pré-requisitos (O Que Você Já Tem)

- Sistema próprio já funcional.
- Acesso e uso manual da API Integra Contador (via interface própria ou bot).
- Conhecimento da API e dos endpoints.

### 4.2 O Que Falta Construir (Inspirado no Calima)

#### Módulo 1 — Gestão de Empresas e Credenciais

**Funcionalidades:**
- CRUD de empresas clientes com campos específicos para o Integra Contador.
- Toggle ativo/inativo por empresa.
- Configuração de tipo de acesso (Procuração vs. Contratação Própria).
- Upload e armazenamento seguro de certificados A1 (.pfx/.p12) com senha criptografada.
- Configuração de Consumer Key/Secret globais (escritório) e individuais (por empresa, quando contratação própria).
- Habilitação de serviços por empresa (PGDAS, DCTFWeb, PGMEI, etc.) com presets automáticos baseados no regime tributário.
- Monitoramento de validade do certificado digital (dias para expirar).

**Tabelas sugeridas:**

```sql
-- Configuração global do escritório
integra_config (
  id, tenant_id,
  certificado_a1_blob, certificado_senha_enc,
  consumer_key, consumer_secret,
  created_at, updated_at
)

-- Empresas habilitadas no Integra
integra_empresas (
  id, empresa_id, tenant_id,
  ativo BOOLEAN,
  tipo_acesso ENUM('procuracao', 'contratacao_propria'),
  consumer_key_individual, consumer_secret_individual,
  certificado_a1_blob, certificado_senha_enc,
  regime_tributario ENUM('simples', 'mei', 'presumido', 'real'),
  servicos_habilitados JSONB,
  certificado_validade DATE,
  created_at, updated_at
)
```

#### Módulo 2 — Camada de Integração com Serpro

**Funcionalidades:**
- Gerenciamento de tokens OAuth (cache, refresh automático no 401).
- Montagem automática do envelope JSON padrão baseado na empresa selecionada.
- Cliente HTTP com mTLS (certificado digital na requisição TLS).
- Tratamento de erros específicos do Serpro (401 = re-auth, 415, 500, etc.).
- Rate limiting interno para não sobrecarregar o gateway.

**Componentes técnicos:**

```
SerproClient
  ├── authenticate(credentials, certificate) → tokens
  ├── refreshToken() → tokens
  ├── buildRequestBody(empresa, servico, dados) → JSON
  ├── call(endpoint, body, tokens) → response
  └── parseResponse(response) → structured data + extracted PDFs
```

#### Módulo 3 — Processamento em Lote (Robôs)

**Funcionalidades:**
- Tela de configuração dos robôs com toggle e dia do mês.
- Sistema de filas (ex: BullMQ, Celery, ou equivalente).
- Worker que processa N empresas por vez com controle de concorrência.
- Registro de status por empresa por execução (sucesso, erro, ignorado).
- Notificações de falhas (email, push, ou na interface).
- Logs detalhados acessíveis ao usuário.

**Jobs sugeridos:**

| Job | idSistema/idServico | Frequência |
|-----|-------------------|-----------|
| Gerar PGDAS + DAS | PGDASD | Mensal (dia 15-20) |
| Gerar DEFIS | DEFIS | Anual |
| Gerar DAS-MEI | PGMEI | Mensal |
| Transmitir DCTFWeb + DARF | DCTFWEB | Mensal |
| Gerar MIT | MIT | Mensal |
| Consultar CND | CND | Mensal ou por vencimento |
| Consultar Caixa Postal | CAIXAPOSTAL | Semanal ou diário |
| Verificar pagamentos | Vários | Periódico |
| Gerar parcelas SN/MEI | PARCSN/PARCMEI | Mensal |

**Tabelas sugeridas:**

```sql
-- Configuração dos robôs
integra_robos (
  id, tenant_id,
  tipo_robo VARCHAR,  -- 'pgdas', 'dctfweb', etc.
  ativo BOOLEAN,
  dia_execucao INTEGER,  -- dia do mês
  hora_execucao TIME,
  created_at, updated_at
)

-- Histórico de execuções
integra_execucoes (
  id, robo_id, tenant_id,
  data_execucao TIMESTAMP,
  status ENUM('running', 'completed', 'partial', 'failed'),
  total_empresas INTEGER,
  sucesso INTEGER,
  falhas INTEGER,
  ignoradas INTEGER,
  duracao_ms INTEGER
)

-- Resultado por empresa por execução
integra_execucao_itens (
  id, execucao_id, empresa_id,
  status ENUM('success', 'error', 'skipped'),
  mensagem TEXT,
  dados_resposta JSONB,
  pdf_gerado_url VARCHAR,
  custo_estimado DECIMAL,
  created_at
)
```

#### Módulo 4 — Armazenamento de Resultados

**Funcionalidades:**
- Persistir guias geradas (DAS, DARF) como PDF no storage (S3, filesystem, etc.).
- Histórico de declarações enviadas e recibos.
- Mensagens da Caixa Postal com status lida/não-lida.
- Situação fiscal (SITFIS) por empresa.
- Certidões negativas com data de emissão e validade.

**Tabelas sugeridas:**

```sql
-- Guias geradas
integra_guias (
  id, empresa_id, tenant_id,
  tipo ENUM('das', 'darf', 'das_mei', 'das_avulso', 'das_cobranca'),
  competencia VARCHAR,  -- '202501'
  valor DECIMAL,
  vencimento DATE,
  status_pagamento ENUM('pendente', 'pago', 'vencido'),
  pdf_path VARCHAR,
  codigo_barras VARCHAR,
  numero_documento VARCHAR,
  created_at
)

-- Declarações transmitidas
integra_declaracoes (
  id, empresa_id, tenant_id,
  tipo ENUM('pgdas', 'defis', 'dctfweb', 'mit'),
  competencia VARCHAR,
  numero_recibo VARCHAR,
  pdf_recibo_path VARCHAR,
  status ENUM('transmitida', 'rejeitada', 'processada'),
  dados_resposta JSONB,
  created_at
)

-- Caixa Postal
integra_caixa_postal (
  id, empresa_id, tenant_id,
  assunto VARCHAR,
  conteudo TEXT,
  data_mensagem TIMESTAMP,
  lida BOOLEAN DEFAULT FALSE,
  dados_originais JSONB,
  created_at
)

-- CND
integra_cnd (
  id, empresa_id, tenant_id,
  situacao ENUM('negativa', 'positiva_com_efeito_negativa', 'positiva'),
  data_emissao DATE,
  data_validade DATE,
  pdf_path VARCHAR,
  created_at
)
```

#### Módulo 5 — Dashboard e Relatórios

**Funcionalidades:**

**Dashboard:**
- Cards de resumo: total de empresas ativas, guias geradas no mês, guias pendentes, guias vencidas.
- Gráfico de barras horizontal agrupado por serviço (inspirado no Calima).
- Clique no gráfico → navega para a tela de detalhe com filtro aplicado.
- Estimativa de custo Serpro no mês atual.
- Status dos robôs (última execução, próxima execução).
- Alertas: certificados próximos do vencimento, procurações a vencer, falhas nos robôs.

**Relatório de Detalhamento de Cobrança:**
- Consumo por empresa, por serviço, por usuário.
- Valor estimado com base nas faixas do Serpro.
- Exportação em PDF/Excel.

#### Módulo 6 — Telas de Operação Manual

Cada serviço principal deve ter uma tela dedicada onde o contador pode:

1. Ver lista de empresas com status daquele serviço.
2. Selecionar uma ou várias empresas.
3. Executar a ação manualmente (gerar guia, transmitir declaração, consultar).
4. Ver resultado imediato na tela.
5. Baixar PDFs gerados.
6. Filtrar por competência, status, regime tributário.

**Telas necessárias:**
- PGDAS (Simples Nacional)
- DCTFWeb / DARF
- PGMEI / CCMEI
- SICALC
- SITFIS (Situação Fiscal)
- CND (Certidões)
- Caixa Postal
- Parcelamentos SN/MEI

### 4.3 Modelo de Negócio Sugerido

Baseado no que o mercado pratica:

| Abordagem | Descrição | Exemplo |
|-----------|-----------|---------|
| **Premium Feature** | Módulo incluso em plano avançado do sistema | Calima Pro |
| **Revenda com Markup** | Software-house contrata no Serpro com volume alto e repassa ao cliente com margem | Alterdata |
| **Feature Gratuita** | Diferencial competitivo, sem custo adicional. Contador contrata Serpro direto. | SCI Sistemas |
| **Cobrança por Uso** | Cobra do contador uma taxa por empresa/mês habilitada no módulo | Modelo híbrido |

### 4.4 Cronograma Sugerido

| Fase | Duração | Entregas |
|------|---------|----------|
| **Fase 1 — Core** | 4-6 semanas | Camada de integração Serpro (auth, mTLS, request builder), CRUD de empresas e credenciais, 1 serviço completo (PGDAS ou DCTFWeb) como prova de conceito |
| **Fase 2 — Operações Manuais** | 4-6 semanas | Telas de todos os serviços com execução manual, armazenamento de guias e declarações, download de PDFs |
| **Fase 3 — Automação** | 3-4 semanas | Sistema de filas e jobs, configuração dos robôs, processamento em lote, logs de execução |
| **Fase 4 — Dashboard + Relatórios** | 2-3 semanas | Dashboard interativo, relatório de cobrança, alertas de certificados e prazos |
| **Fase 5 — Caixa Postal + CND** | 2-3 semanas | Inbox da Receita Federal, consulta automatizada de CND |
| **Fase 6 — Polish + Novos Serviços** | Contínuo | MIT, SICALC, Parcelamentos, eConsignado, FGTS Digital conforme Serpro disponibiliza |

### 4.5 Pontos de Atenção Técnicos

1. **mTLS com Certificado A1**: A parte mais delicada. O certificado .p12/.pfx precisa ser carregado em memória e usado como client certificate na conexão TLS com o gateway do Serpro. Bibliotecas como `axios` + `https.Agent` (Node.js) ou `requests` com `pkcs12` (Python) suportam isso.

2. **Armazenamento seguro de certificados**: Certificados e senhas devem ser criptografados at-rest (AES-256 ou equivalente). Considerar uso de vault (HashiCorp Vault, AWS KMS).

3. **Controle de concorrência**: O Serpro pode ter rate limits. Implementar throttling no processamento em lote (ex: máximo 5 chamadas simultâneas por contrato).

4. **Idempotência**: O Serpro retifica automaticamente declarações reenviadas para o mesmo período. O sistema precisa controlar para não reenviar desnecessariamente.

5. **Respostas assíncronas**: Alguns serviços do Serpro são assíncronos (ex: encerramento MIT). O sistema precisa implementar polling ou webhook para verificar resultado.

6. **Tratamento de PDFs em Base64**: Muitos endpoints retornam PDFs como string base64. Decodificar e armazenar como arquivo.

7. **Multi-tenancy**: Se o sistema atende múltiplos escritórios, cada tenant tem suas próprias credenciais, certificados e empresas. Isolamento de dados é crítico.

---

## PARTE 5 — Referência Visual (UX do Calima)

### 5.1 Telas Identificadas

| Tela | Descrição | Elementos-chave |
|------|-----------|-----------------|
| Manutenção > Empresas | Lista de empresas com toggle | Tabela: Nome, Cert. Validade, Status (toggle), Config (engrenagem) |
| Config da Empresa | Modal/tela de config individual | Tipo acesso (radio), Certificado (upload), Chaves (inputs), Serviços (checkboxes) |
| Manutenção > Configuração | Config geral + robôs | Upload cert global, chaves globais, seção "Automatização dos Robôs" com toggles e campos de dia |
| Dashboard | Painel inicial | Cards de resumo, gráficos de barras interativos, estimativa de custo |
| PGDAS | Tela operacional SN | Lista de empresas, status por competência, botões de ação |
| DCTFWeb | Tela operacional DCTF | Idem |
| Caixa Postal | Inbox por empresa | Lista de mensagens, filtro por empresa, status lida/não-lida |
| Relatório Cobrança | Relatório de consumo | Tabela detalhada, filtro por período/empresa/serviço |

### 5.2 Padrão de Interação

O padrão do Calima é consistente:

1. **Seleção de empresas** → Tabela com checkbox para seleção múltipla.
2. **Ação em lote** → Botão "Gerar para selecionadas" ou "Gerar para todas".
3. **Feedback visual** → Status atualiza em tempo real (processando, sucesso, erro).
4. **Download** → Ícone de download individual ou "Baixar todas".
5. **Alerta de custo** → Ícone "$" sempre que a ação gera bilhetagem no Serpro.

---

## Conclusão

O módulo Integra Contador do Calima é essencialmente uma **camada de orquestração** sobre a API do Serpro, com três pilares: gestão de credenciais multi-empresa, automação via robôs agendados e uma interface que consolida todos os resultados. O diferencial não está na complexidade técnica da integração em si (a API do Serpro é bem padronizada), mas sim na experiência do usuário — poder gerenciar centenas de empresas, automatizar tudo e ter visibilidade consolidada em dashboards.

Para o seu projeto, dado que você já faz uso manual da API, o maior salto é implementar o sistema de filas/robôs e a gestão multi-empresa com credenciais, que é o que transforma uma ferramenta individual numa plataforma SaaS para escritórios contábeis.
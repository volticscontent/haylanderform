# Análise das APIs do Frontend - Haylander Form

## Visão Geral

Esta análise identifica as APIs disponíveis no frontend do Haylander Form e suas utilizações atuais, com foco especial na página Serpro e nas APIs do diretório `src/app/api/`.

## APIs Utilizadas no Frontend

### 1. API Serpro (Principal)
**Arquivo:** `src/app/(admin)/serpro/page.tsx`
**Endpoint:** `/api/serpro`
**Método:** POST
**Uso:** Consulta de dados fiscais e tributários via API do Serpro

**Parâmetros enviados:**
- `cnpj`: CNPJ da empresa
- `service`: Tipo de serviço (CCMEI_DADOS, PGMEI, etc.)
- `ano`: Ano de referência
- `mes`: Mês opcional
- `numeroRecibo`: Número do recibo para relatórios
- `protocoloRelatorio`: Protocolo para relatórios SITFIS
- `codigoReceita`: Código da receita
- `categoria`: Categoria para DCTFWEB

### 2. API SITFIS (Relatório Fiscal)
**Função:** `fetchSitfisRelatorio()`
**Uso:** Geração de relatórios fiscais em PDF
**Armazenamento:** PDFs salvos no R2 via `savePdfToR2()`

## APIs Disponíveis no Diretório /api

### 2.1 APIs de Clientes/Leads
- **`/api/leads/bulk-update`** - Atualização em massa de leads
- **`/api/leads/bulk-delete`** - Exclusão em massa de leads  
- **`/api/leads/by-phone`** - Consulta de leads por telefone
- **`/api/leads/unique-values`** - Valores únicos de leads
- **`/api/leads/update-meeting`** - Atualização de reuniões

### 2.2 APIs de Mensagens
- **`/api/messages/send`** - Envio de mensagens (requere x-api-key)
- **`/api/whatsapp/sync-contacts`** - Sincronização de contatos WhatsApp
- **`/api/whatsapp/profile-pic`** - Fotos de perfil do WhatsApp

### 2.3 APIs Serpro (Backend Proxy)
- **`/api/serpro`** - Proxy para API do Serpro (com autenticação)
- **`/api/serpro/health`** - Monitoramento de saúde do Serpro
- **`/api/serpro/history`** - Histórico de consultas
- **`/api/serpro/clients`** - Gerenciamento de clientes
- **`/api/serpro/carteira`** - Carteira de clientes
- **`/api/serpro/documentos`** - Gerenciamento de documentos
- **`/api/serpro/procuracao/[leadId]`** - Procurações eletrônicas

### 2.4 APIs de Serviços
- **`/api/services`** - Gerenciamento geral de serviços
- **`/api/services/[id]`** - Serviço específico

### 2.5 APIs de Disparos
- **`/api/disparos/create`** - Criação de disparos
- **`/api/disparos/callback`** - Callback de disparos

### 2.6 APIs de Formulários
- **`/api/mei/submit`** - Submissão de formulário MEI
- **`/api/ecac/submit`** - Submissão de formulário e-CAC

### 2.7 APIs de Usuário
- **`/api/user/[phone]`** - Dados do usuário por telefone

### 2.8 APIs de Teste
- **`/api/teste/evolution/whatsapp-numbers`** - Teste de números WhatsApp

### 2.9 APIs de Fallback
- **`/api/fallback`** - Rota de fallback genérica

## Arquitetura de Proxy

Todas as APIs do frontend utilizam o padrão **Backend Proxy**, onde:
1. O frontend faz requisições para rotas `/api/*`
2. Essas rotas fazem proxy para o `bot-backend` real
3. A autenticação é verificada no frontend antes do proxy
4. O backend real processa a lógica pesada

## Serviços Serpro Disponíveis

Baseado em `src/lib/serpro-config.ts`, os seguintes serviços estão configurados:

### Dados Cadastrais
- **CCMEI_DADOS** - Dados cadastrais completos do MEI

### Guias e Débitos (PGMEI)
- **PGMEI** - Débitos e dívida ativa
- **PGMEI_EXTRATO** - PDF do DAS
- **PGMEI_BOLETO** - Código de barras do DAS
- **PGMEI_ATU_BENEFICIO** - Atualização de benefícios

### Situação Fiscal
- **SIT_FISCAL_SOLICITAR** - Solicitar protocolo
- **SIT_FISCAL_RELATORIO** - Relatório fiscal completo

### Declarações
- **DASN_SIMEI** - Declaração anual MEI
- **PGDASD** - Extrato Simples Nacional
- **DCTFWEB** - Declaração DCTFWeb

### Parcelamentos
- **PARCELAMENTO_MEI_CONSULTAR/EMITIR** - Parcelamentos MEI
- **PARCELAMENTO_SN_CONSULTAR/EMITIR** - Parcelamentos Simples Nacional

### Dívida Ativa
- **PGFN_PAEX** - Parcelamento PGFN
- **PGFN_SIPADE** - Parcelamento SIPADE

### Outros Serviços
- **CND** - Certidão negativa de débitos
- **PROCESSOS** - Consulta de processos
- **CAIXA_POSTAL** - Caixa postal eletrônica
- **PROCURACAO** - Procurações eletrônicas

## Observações Importantes

1. **Nem todas as APIs estão sendo utilizadas** no frontend atualmente
2. **A página Serpro apenas usa uma fração** dos serviços disponíveis
3. **Muitas APIs estão disponíveis mas não implementadas** na interface
4. **O proxy pattern permite fácil expansão** sem expor o backend diretamente
5. **A autenticação é gerenciada no frontend** antes de fazer o proxy

## Recomendações

1. Implementar interfaces para os serviços Serpro não utilizados
2. Criar dashboard unificado para todas as APIs disponíveis
3. Documentar quais APIs estão ativas vs disponíveis
4. Considerar implementar cache para respostas frequentes
5. Adicionar monitoramento de uso por API
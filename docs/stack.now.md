# stack.now.md — Estado Atual da Stack Haylander MEI System

> **Autor**: Gustavo (sênior-eng.)
> **Cliente**: Haylander Martins Contabilidade — CNPJ 51.564.549/0001-40
> **Última atualização**: 2026-04-13
> **Status do projeto**: Finalização (MVP funcional, ajustes de estabilidade)

---

## 1. Visão Geral

Sistema ERP + CRM com Agentes de IA no WhatsApp, construído sob medida para a Haylander Martins Contabilidade. O foco é no atendimento automatizado de **MEIs (Microempreendedores Individuais)**, cobrindo qualificação, consulta fiscal via Serpro, regularização e vendas — tudo orquestrado por IA.

### Composição

| # | Serviço | Tech | Deploy | Porta |
|---|---------|------|--------|-------|
| 1 | **Frontend Admin** (CRM + Dashboard) | Next.js 16 / React 19 | Vercel | — |
| 2 | **Bot Backend** (IA + Filas + Webhook) | Express 4 + BullMQ | Docker → Easypanel | 3001 |
| 3 | **Socket Server** (Relay real-time) | Express + Socket.io | Easypanel | 3002 |

### Integrações Externas

| # | Serviço | Finalidade | Status |
|---|---------|------------|--------|
| 1 | **PostgreSQL** | Banco relacional principal | ✅ Estável |
| 2 | **Redis** | Cache, PubSub, filas BullMQ | ✅ Estável |
| 3 | **Cloudflare R2** | Armazenamento de documentos/mídia | ✅ Estável |
| 4 | **Serpro Integra Contador** | Consultas fiscais (PGMEI, SITFIS, CCMEI, etc) | ⚠️ Instável |
| 5 | **Evolution API** | Gateway WhatsApp (Baileys) | ✅ Estável |
| 6 | **OpenAI** | Agentes de conversa GPT-4o | ✅ Estável |

---

## 2. Frontend — Next.js 16 (Vercel)

### Stack

| Componente | Versão | Nota |
|------------|--------|------|
| Next.js | 16.0.7 | App Router |
| React | 19.2.0 | Server Components |
| TypeScript | 5.9.3 | Strict |
| TailwindCSS | 4 | + tailwindcss-animate |
| Recharts | 3.5 | Gráficos do Dashboard |
| Framer Motion | 12.29 | Animações |
| Lucide React | 0.556 | Ícones |

### Módulos Admin

| Rota | Descrição |
|------|-----------|
| `/dashboard` | KPIs, gráficos de funil, métricas diárias |
| `/lista` | CRM completo — tabela de leads com filtros e edição inline |
| `/atendimento` | Chat WhatsApp real-time (Socket.io) |
| `/serpro` | Console de consulta fiscal (25 serviços Serpro) |
| `/disparo` | Campanhas de disparo em massa (WhatsApp) |
| `/configuracoes` | Configurações do sistema |
| `/docs` | Documentação interna |

### API Routes Relevantes

| Rota | O que faz |
|------|-----------|
| `/api/leads/*` | CRUD + filtros + valores únicos para selects |
| `/api/serpro/*` | Proxy de consultas Serpro com cache em `consultas_serpro` |
| `/api/messages/*` | Histórico de mensagens (Evolution DB) |
| `/api/whatsapp/*` | Envio de mensagens via Evolution API |
| `/api/disparos/*` | CRUD + execução de campanhas |
| `/api/context/*` | Debug de contexto IA para atendimento |

---

## 3. Bot Backend — Express (Docker/Easypanel)

### Stack

| Componente | Versão |
|------------|--------|
| Express | 4.21 |
| BullMQ | 5.34 |
| node-cron | 3.0 |
| OpenAI SDK | 4.76 |
| Socket.io | 4.8 |
| pg | 8.20 |
| ioredis | 5.4 |

### Workers BullMQ (3 filas)

| Fila | Função | Detalhes |
|------|--------|----------|
| `message-sending` | Envio de mensagens | Rate-limit + delays simulando digitação humana |
| `follow-up` | Nudge de inatividade | Timer 5min após última mensagem sem resposta |
| `message-debounce` | Debounce inteligente | Agrupa mensagens rápidas do cliente (~1.5s) antes de mandar para a IA |

### Agentes de IA

| Agente | Arquivo | Função |
|--------|---------|--------|
| **Apollo** (SDR) | `agents/apolo.ts` (25KB) | Qualificação, triagem, coleta de dados, detecção de situação cadastral |
| **Vendedor** (Closer) | `agents/vendedor.ts` (5.9KB) | Diagnóstico, proposta de valor, agendamento de reunião |
| **Atendente** (Suporte) | `agents/atendente.ts` (4KB) | Transbordo humano, notificação do time |

### Tools (Function Calling — GPT)

Arquivo principal: `ai/server-tools.ts` (39KB) — expõe as seguintes ferramentas ao modelo:

- `getUser` / `updateUser` — CRUD no banco de leads
- `consultarSerpro` — consulta fiscal via Serpro Integra Contador
- `getAgentRouting` — lê routing override do Redis
- Upload/download de arquivos no R2
- Consulta de histórico de chat

### CRON Jobs

| Frequência | Job | Detalhe |
|------------|-----|---------|
| `*/30 * * * *` | Follow-up inatividade | Leads sem resposta >2h recebem lembrete |
| `0 3 * * *` | Limpeza noturna | Remove chat_history >7 dias |
| `0 8 * * *` | Relatório diário | Resumo de KPIs via WhatsApp para o Haylander |
| `*/1 * * * *` | Keep-alive Evolution | Reconecta instância se desconectada |

### Deploy

```dockerfile
# Multi-stage: node:20-alpine
# Build: tsc → dist/
# Runtime: node dist/index.js
# Requer: --openssl-legacy-provider (certificado PFX legado)
EXPOSE 3001
```

---

## 4. PostgreSQL

| Campo | Valor |
|-------|-------|
| Host | `easypanel.landcriativa.com:9000` |
| Database | `systembots` |
| Driver | `pg` (Pool direto, sem ORM) |
| SSL | ⚠️ Desabilitado (`sslmode=disable`) |

### Tabelas do Sistema

| Tabela | Relação | Finalidade |
|--------|---------|------------|
| `leads` | Raiz | Dados de contato (telefone, CPF, senha GOV) |
| `leads_empresarial` | 1:1 → leads | CNPJ, razão social, dados_serpro (JSONB) |
| `leads_qualificacao` | 1:1 → leads | Situação, MQL/SQL/ICP, motivo |
| `leads_financeiro` | 1:1 → leads | Dívidas (federal, ativa, municipal, estadual) |
| `leads_vendas` | 1:1 → leads | Serviço negociado, procuração, reunião |
| `leads_atendimento` | 1:1 → leads | Atendente, controle 24h, observações |
| `consultas_serpro` | Auxiliar | Cache/log de chamadas à API Serpro |
| `disparos` | Auxiliar | Campanhas de disparo em massa |

> **Nota**: O mesmo PostgreSQL hospeda tabelas da Evolution API (`Instance`, `Contact`, `Chat`, `Message`) — usadas para queries diretas de histórico.

---

## 5. Redis

| Campo | Valor |
|-------|-------|
| Host | `easypanel.landcriativa.com:1000` |
| Driver | `ioredis` |

### Chaves e Canais

| Chave/Canal | Uso |
|-------------|-----|
| `haylander-chat-updates` | PubSub — mensagens novas para o frontend |
| `lid_map:{jid}` | Resolução LID → telefone (WA Business) |
| `routing_override:{phone}` | Override de roteamento de agente |
| `evolution:last_activity` | Timestamp para keep-alive |
| `bull:*` | Filas BullMQ (message-sending, follow-up, debounce) |

---

## 6. Cloudflare R2

| Campo | Valor |
|-------|-------|
| Provider | Cloudflare R2 (compatível S3) |
| SDK | `@aws-sdk/client-s3` + `s3-request-presigner` |
| Bucket | `haylander` |
| CDN Pública | `pub-9bcc48f0ec304eabbad08c9e3dec23de.r2.dev` |

### Operações Implementadas

- `uploadFileToR2()` — Upload direto (Buffer → R2)
- `getFileFromR2()` — Download como string
- `deleteFileFromR2()` — Exclusão
- `listFilesFromR2()` — Listagem por prefixo
- `getPresignedUploadUrl()` — URL pré-assinada (1h TTL)

### Uso Atual

- Documentos/PDFs de leads
- Mídia recebida/enviada no WhatsApp
- Arquivos do sistema (cartão CNPJ, etc.)

---

## 7. Serpro — Integra Contador

| Campo | Valor |
|-------|-------|
| API | Integra Contador v1 |
| Gateway | `gateway.apiserpro.serpro.gov.br` |
| Auth | mTLS (Certificado Digital PFX) + OAuth2 (`client_credentials`) |
| Auth URL | `autenticacao.sapi.serpro.gov.br/authenticate` |
| Role | `TERCEIROS` |
| Contratante | CNPJ `51.564.549/0001-40` |

### Catálogo de Serviços (25 endpoints)

#### Consultas Cadastrais
| Serviço | ID | Versão | Tipo |
|---------|----|--------|------|
| CCMEI Dados Cadastrais | DADOSCCMEI122 | 1.2.2 | Consultar |
| SIMEI Enquadramento | DADOSCCMEI122 | 1.2.2 | Consultar |

#### Débitos e Guias MEI (PGMEI)
| Serviço | ID | Versão | Tipo |
|---------|----|--------|------|
| Débitos/Dívida Ativa | DIVIDAATIVA24 | 2.4 | Consultar |
| Gerar DAS PDF | GERARDASPDF21 | — | Emitir |
| Gerar Código de Barras | GERARDASCODBARRA22 | — | Emitir |
| Atualizar Benefício | ATUBENEFICIO23 | — | Emitir |

#### Situação Fiscal (SITFIS)
| Serviço | ID | Versão | Tipo |
|---------|----|--------|------|
| Solicitar Protocolo | SOLICITARPROTOCOLO91 | 2.0 | Apoiar |
| Relatório Fiscal | RELATORIOSITFIS92 | 2.0 | Emitir |

#### Declarações
| Serviço | ID | Versão | Tipo |
|---------|----|--------|------|
| DASN-SIMEI | CONSULTIMADECREC152 | 1.5.2 | Consultar |
| PGDAS-D Extrato | CONSEXTRATO16 | 1.6 | Consultar |
| DCTFWeb | CONSDECCOMPLETA33 | — | Consultar |

#### Parcelamentos
| Serviço | ID | Tipo |
|---------|----|----|
| Parcelamento MEI (consulta) | PEDIDOSPARC203 | Consultar |
| Parcelamento MEI (emissão) | GERARDAS201 | Emitir |
| Parcelamento SN (consulta) | PEDIDOSPARC163 | Consultar |
| Parcelamento SN (emissão) | GERARDAS161 | Emitir |

#### Dívida Ativa / PGFN
| Serviço | ID | Tipo |
|---------|----|----|
| PAEX | OBTEREXTRATOPARC245 | Consultar |
| SIPADE | OBTEREXTRATOPARC251 | Consultar |
| Dívida Ativa (MEI) | DIVIDAATIVA24 | Consultar |

#### Outros
| Serviço | ID | Tipo |
|---------|----|----|
| CND | RELATORIOSITFIS92 | Emitir |
| e-Processo | CONSPROCPORINTER271 | Consultar |
| Caixa Postal (DTE) | MSGCONTRIBUINTE61 | Consultar |
| Procuração (e-CAC) | OBTERPROCURACAO41 | Consultar |
| Comprovante Arrecadação | COMPARRECADACAO72 | Consultar |

### Resultados de Teste Real (2026-04-16 — CNPJ de teste)

| Serviço | Tipo | Status no Teste | Observação |
|---------|------|-----------------|------------|
| `SIT_FISCAL_SOLICITAR` → `SIT_FISCAL_RELATORIO` | Emissão (PDF) | ✅ **Funcionou** | PDF retornou em base64; arquivo salvo com sucesso. Requer 2 chamadas: solicitar + buscar relatório. |
| `CCMEI_DADOS` | Emissão (PDF — Certificado CCMEI) | ⚠️ **Não emitido** | CNPJ de teste retornou "não é mais MEI". Lógica correta; bloqueio foi de dados, não de código. |
| `PGDASD` | Consulta/Emissão (depende da operação) | ❌ **Falhou** | Erro por `numeroDas` inválido no payload. Endpoint válido; falta ajuste de parâmetros. |
| `PGMEI` | Consulta | ✅ **Retornou dados** | Retornou status/mensagens de débitos. Sem emissão de PDF nesse fluxo. |
| `PGFN_CONSULTAR` | Consulta | ✅ **Retornou dados** | Retornou situação de dívida ativa. Sem emissão de PDF nesse fluxo. |

> **Legenda**: ✅ OK | ⚠️ Bloqueio por dados | ❌ Erro de implementação

### Problemas Conhecidos (Serpro)

- **HTTP 400 / MSG_23030**: Versionamento errado ou payload malformado. Resolvido definindo `versaoSistema: '2.4'` para PGMEI/DIVIDAATIVA.
- **Certificado Legado (RC2-40-CBC)**: Requer `--openssl-legacy-provider` e extração via `node-forge` ao invés de `crypto` nativo.
- **Token cacheado sem TTL**: O token OAuth2 é cacheado em memória sem controle de expiração real — funciona por retry em 401.
- **Cache de consultas**: Tabela `consultas_serpro` evita chamadas duplicadas. Sem invalidação automática por tempo.
- **PGDASD**: Requer `numeroDas` válido no payload — campo não pode ser genérico ou placeholder.

---

## 8. Evolution API (WhatsApp)

| Campo | Valor |
|-------|-------|
| Provider | Evolution API (Baileys) |
| Host | `evolutionapi.landcriativa.com` |
| Instância | `teste` |
| Comunicação | REST + WebSocket |

### Funcionalidades em Uso

- Envio: texto, mídia (imagem/vídeo/documento), áudio
- Recebimento: webhook `messages.upsert` → Bot Backend
- Listagem de chats e mensagens históricas
- Foto de perfil de contatos
- Verificação de números válidos
- WebSocket para real-time
- Keep-alive via CRON (reconecta instância automaticamente)

---

## 9. OpenAI

| Campo | Valor |
|-------|-------|
| Frontend SDK | `openai@6.10` |
| Bot Backend SDK | `openai@4.76` |
| Modelo | GPT-4o (Function Calling) |
| Uso | Agentes de conversa, embeddings |

---

## 10. Infraestrutura de Deploy

```
┌────────────────────────────────┐
│          VERCEL (Cloud)        │
│  Frontend Next.js 16           │
│  haylanderform.vercel.app      │
└───────────┬────────────────────┘
            │ API calls
┌───────────▼────────────────────────────────────────┐
│              EASYPANEL (VPS landcriativa.com)       │
│                                                     │
│  ┌─────────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ Bot Backend  │  │ PostgreSQL│  │    Redis      │ │
│  │ Docker :3001 │  │    :9000  │  │    :1000      │ │
│  └──────┬───────┘  └───────────┘  └──────────────┘ │
│         │                                           │
│  ┌──────▼───────┐  ┌───────────┐                   │
│  │ Socket Server│  │ Evolution │                    │
│  │ Node   :3002 │  │ API (WA)  │                   │
│  └──────────────┘  └───────────┘                   │
└─────────────────────────────────────────────────────┘

┌────────────────────────────────┐
│       CLOUDFLARE (CDN)         │
│  R2 Storage (bucket: haylander)│
└────────────────────────────────┘

┌────────────────────────────────┐
│       APIs EXTERNAS            │
│  Serpro (gateway.apiserpro)    │
│  OpenAI (api.openai.com)       │
└────────────────────────────────┘
```

---

## 11. Problemas Abertos e Débitos Técnicos

### 🔴 Críticos

| # | Problema | Impacto |
|---|----------|---------|
| 1 | **Serpro instável** — Erros 400/401 recorrentes, versionamento frágil | Consultas fiscais falham, impacta qualificação |
| 2 | **SSL desabilitado no PostgreSQL** — dados sensíveis (CPF, senha GOV) trafegam sem criptografia | Risco de segurança |
| 3 | **Certificado PFX commitado** no repo com senha em `.env` | Risco de vazamento se repo for público |

### 🟡 Importantes

| # | Problema | Impacto |
|---|----------|---------|
| 4 | **Código duplicado** — `serpro.ts`, `r2.ts`, `redis.ts`, `db.ts` existem em frontend E bot-backend | Bug silencioso quando atualiza um e esquece o outro |
| 5 | **Versões divergentes OpenAI SDK** — frontend v6 vs bot v4 | Incompatibilidade de API |
| 6 | **Socket Server potencialmente redundante** — relay standalone + socket embutido no bot-backend | Complexidade desnecessária |
| 7 | **Sem leitura inteligente de documentos/fotos** — OCR/Vision API não implementado | Haylander precisa para ler RG, CNPJ card, etc. |
| 8 | **Gerenciamento R2 incompleto** — sem organização por lead_id, sem garbage collection | Arquivos órfãos se acumulam |

### 🟢 Melhorias Planejadas

| # | Melhoria | Fase |
|---|----------|------|
| 9 | Monorepo com lib compartilhada (elimina duplicação) | Pós-MVP |
| 10 | Vision API para leitura de docs (GPT-4 Vision ou Google Cloud Vision) | Próxima sprint |
| 11 | Context-line: R2 organizado por `leads/{id}/docs/` com metadata | Próxima sprint |
| 12 | SSL no PostgreSQL | Imediato |

---

## 12. Custos Operacionais Estimados

| Serviço | Custo Mensal (est.) |
|---------|---------------------|
| Vercel (Pro) | ~$20 |
| Easypanel VPS | ~$25-50 |
| Cloudflare R2 | ~$5-15 (por uso) |
| OpenAI API | ~$30-100 (variável) |
| Serpro Integra | Certificado digital (anual ~R$200) |
| Evolution API | Self-hosted (incluso no VPS) |
| **Total estimado** | **~$80-185/mês** |

---

*Este documento é vivo e deve ser atualizado conforme o projeto evolui.*

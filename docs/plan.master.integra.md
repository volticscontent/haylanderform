# plan.master.integra.md — Plataforma Integra Contador

> **Status**: Em Andamento 🚧
> **Documento de pesquisa:** `integra.md`
> **Pré-requisito:** Módulos 1, 2, 3 concluídos ✅

---

## 🎯 Objetivo Direto

Evoluir a integração Serpro de invocação manual/bot para uma **plataforma de gestão fiscal** completa no painel Admin. O contador deve conseguir gerenciar todas as empresas clientes, disparar robôs agendados, visualizar guias geradas e monitorar o consumo — tudo sem sair do sistema.

Referência de UX e funcionalidades: **Calima ERP** (ver `integra.md` Parte 2 e 5).

---

## 🗺️ Arquitetura Alvo

```
Admin (Next.js)
  └─ /integra/           → páginas do módulo (novo namespace)
       ├─ empresas/       → CRUD de empresas habilitadas
       ├─ robos/          → config e histórico de robôs
       ├─ dashboard/      → métricas, guias, alertas
       ├─ guias/          → listagem de DAS/DARF por empresa
       └─ caixa-postal/   → mensagens da Receita Federal

bot-backend (Express)
  └─ /routes/integra/    → controllers de cada sub-domínio
       ├─ empresas.ts     → CRUD integra_empresas
       ├─ robos.ts        → config e trigger manual de jobs
       ├─ guias.ts        → histórico de guias + download PDF
       └─ caixa-postal.ts → consulta e marcar como lida
  └─ /queues/integra/    → workers BullMQ (um por robô)
       ├─ job-pgmei.ts
       ├─ job-pgdas.ts
       ├─ job-cnd.ts
       └─ job-caixa-postal.ts
```

---

## 📋 Fase 1 — Fundação: Gestão de Empresas

### Banco de Dados
- [x] Criar migration SQL para `integra_empresas` e `integra_config`.

```sql
-- Configuração global do escritório (single-row por ora)
CREATE TABLE integra_config (
  id SERIAL PRIMARY KEY,
  ativo BOOLEAN DEFAULT true,
  -- Credenciais Serpro (já existem no .env, migrar para DB para futura flexibilidade)
  consumer_key_override VARCHAR,
  consumer_secret_override VARCHAR,
  -- Configuração de scheduler global
  dia_execucao_mensal INTEGER DEFAULT 20, -- dia padrão para robôs mensais
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Empresas clientes habilitadas no Integra
CREATE TABLE integra_empresas (
  id SERIAL PRIMARY KEY,
  cnpj VARCHAR(18) NOT NULL UNIQUE,
  razao_social VARCHAR NOT NULL,
  regime_tributario VARCHAR(20) DEFAULT 'mei', -- 'mei', 'simples', 'presumido', 'real'
  ativo BOOLEAN DEFAULT true,
  -- Serviços habilitados para esta empresa (preset automático por regime)
  servicos_habilitados JSONB DEFAULT '[]',
  -- Referência ao lead (se cliente do CRM)
  lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  certificado_validade DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuração dos robôs por tipo
CREATE TABLE integra_robos (
  id SERIAL PRIMARY KEY,
  tipo_robo VARCHAR(30) NOT NULL UNIQUE, -- 'pgmei', 'pgdas', 'cnd', 'caixa_postal'
  ativo BOOLEAN DEFAULT false,
  dia_execucao INTEGER DEFAULT 20,
  hora_execucao TIME DEFAULT '08:00:00',
  ultima_execucao TIMESTAMPTZ,
  proxima_execucao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de execuções de robôs
CREATE TABLE integra_execucoes (
  id SERIAL PRIMARY KEY,
  robo_tipo VARCHAR(30) NOT NULL,
  iniciado_em TIMESTAMPTZ DEFAULT NOW(),
  concluido_em TIMESTAMPTZ,
  status VARCHAR(15) DEFAULT 'running', -- 'running', 'completed', 'partial', 'failed'
  total_empresas INTEGER DEFAULT 0,
  sucesso INTEGER DEFAULT 0,
  falhas INTEGER DEFAULT 0,
  ignoradas INTEGER DEFAULT 0,
  duracao_ms INTEGER
);

-- Resultado individual por empresa por execução
CREATE TABLE integra_execucao_itens (
  id SERIAL PRIMARY KEY,
  execucao_id INTEGER REFERENCES integra_execucoes(id) ON DELETE CASCADE,
  empresa_id INTEGER REFERENCES integra_empresas(id) ON DELETE CASCADE,
  status VARCHAR(10) DEFAULT 'pending', -- 'success', 'error', 'skipped'
  mensagem TEXT,
  dados_resposta JSONB,
  custo_estimado DECIMAL(10, 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guias geradas (DAS, DARF)
CREATE TABLE integra_guias (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES integra_empresas(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL, -- 'das_mei', 'das_sn', 'darf', 'das_avulso'
  competencia VARCHAR(6), -- '202504'
  valor DECIMAL(10, 2),
  vencimento DATE,
  status_pagamento VARCHAR(15) DEFAULT 'pendente', -- 'pendente', 'pago', 'vencido'
  pdf_r2_key VARCHAR,
  codigo_barras VARCHAR,
  numero_documento VARCHAR,
  dados_originais JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensagens da Caixa Postal da Receita
CREATE TABLE integra_caixa_postal (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES integra_empresas(id) ON DELETE CASCADE,
  assunto VARCHAR,
  conteudo TEXT,
  data_mensagem TIMESTAMPTZ,
  lida BOOLEAN DEFAULT false,
  dados_originais JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Backend
- [x] Criar `bot-backend/src/routes/integra/empresas.ts` — CRUD de `integra_empresas` com presets de `servicos_habilitados` por `regime_tributario`.
- [x] Criar `bot-backend/src/routes/integra/robos.ts` — GET configuração, PATCH ativar/desativar, POST trigger manual.
- [x] Registrar as rotas em `bot-backend/src/index.ts` sob o prefixo `/integra`.

### Frontend Admin
- [x] Criar `src/app/(admin)/integra/empresas/page.tsx` — listagem com toggle ativo/inativo, coluna de validade do certificado.
- [x] Criar `src/app/(admin)/integra/empresas/actions.ts` — Server Actions para CRUD via proxy BFF.
- [x] Criar modal/form de edição de empresa (regime tributário, serviços habilitados como checkboxes).

---

## 📋 Fase 2 — Robôs BullMQ

### Workers
- [ ] Criar `bot-backend/src/queues/integra/job-pgmei.ts` — Busca todas `integra_empresas` com MEI ativo e serviço PGMEI habilitado. Para cada uma, chama `consultarServico('PGMEI', cnpj)`. Persiste em `integra_guias`. Registra em `integra_execucao_itens`.
- [ ] Criar `bot-backend/src/queues/integra/job-cnd.ts` — Consulta CND para empresas habilitadas. Salva em tabela `integra_cnd` (adicionar migration).
- [ ] Criar `bot-backend/src/queues/integra/job-caixa-postal.ts` — Consulta `CAIXAPOSTAL` para todas as empresas ativas. Upsert em `integra_caixa_postal`.
- [ ] Registrar os workers no scheduler do `bot-backend/src/cron/index.ts` lendo configuração de `integra_robos`.

### Controle de Concorrência
- [ ] Limitar processamento a 3 empresas simultâneas por job (evitar throttle do Serpro).
- [ ] Implementar retry com backoff exponencial em caso de 401 (re-autenticar) ou 500.

---

## 📋 Fase 3 — Dashboard e Telas Operacionais

### Dashboard `/integra/dashboard`
- [ ] Criar `src/app/(admin)/integra/dashboard/page.tsx` com:
  - Cards: total empresas ativas, guias geradas no mês, guias pendentes, guias vencidas.
  - Tabela de status dos robôs (última execução, próxima, % sucesso).
  - Alertas: empresas com certificado a vencer em < 30 dias.
- [ ] Criar `bot-backend/src/routes/integra/dashboard.ts` — endpoint `GET /integra/dashboard/summary` com dados agregados.

### Tela de Guias `/integra/guias`
- [ ] Listagem de `integra_guias` com filtros por empresa, competência, tipo, status.
- [ ] Botão de download do PDF (URL pré-assinada do R2).
- [ ] Ação "Gerar manualmente" para empresa selecionada (chama job pontual via POST).

### Caixa Postal `/integra/caixa-postal`
- [ ] Listagem de `integra_caixa_postal` com filtro por empresa e status lida/não-lida.
- [ ] Ação "Marcar como lida" e "Sincronizar agora" (trigger manual do job).

### Configuração dos Robôs `/integra/robos`
- [ ] Listagem dos robôs com toggle ativo/inativo, campo dia do mês, histórico das últimas 5 execuções.
- [ ] Botão "Executar agora" por robô.

---

## 📋 Fase 4 — Relatório de Cobrança (Billing Tracker)

- [ ] Adicionar coluna `custo_estimado` em `integra_execucao_itens` (já prevista na migration acima).
- [ ] Criar tabela de preços do Serpro (`integra_precos`) — tipo + faixa de consumo → valor unitário.
- [ ] Endpoint `GET /integra/billing?mes=YYYY-MM` que agrega consumo + custo estimado por empresa/serviço.
- [ ] Tela `/integra/billing` com tabela detalhada e totais por período.

---

## 🧭 Notas de Implementação

### Usando o `consultarServico` Existente
Todos os jobs devem chamar `consultarServico(service, cnpj, options)` de `bot-backend/src/lib/serpro.ts` — não reimplementar o cliente HTTP. A camada já cuida de mTLS, token refresh e parsing.

### Salvando PDFs no R2
Quando o resultado de `consultarServico` contiver um campo `pdf` ou `conteudo` em base64:
```ts
const buf = Buffer.from(resultado.pdf, 'base64');
const key = `integra/${cnpj}/${tipo}/${competencia}.pdf`;
await uploadToR2(key, buf, 'application/pdf');
await query('UPDATE integra_guias SET pdf_r2_key = $1 WHERE id = $2', [key, guiaId]);
```

### Presets de Serviços por Regime
```ts
const PRESETS: Record<string, string[]> = {
  mei:       ['PGMEI', 'CCMEI_DADOS', 'CAIXAPOSTAL'],
  simples:   ['PGDASD', 'DEFIS', 'PARCELAMENTO_SN_CONSULTAR', 'CND', 'CAIXAPOSTAL'],
  presumido: ['DCTFWEB', 'SICALC', 'SITFIS', 'CND', 'CAIXAPOSTAL'],
  real:      ['DCTFWEB', 'SICALC', 'SITFIS', 'CND', 'CAIXAPOSTAL'],
};
```

### Segurança da Rota
Todas as rotas `/integra/*` devem validar o header `x-api-secret` igual a `process.env.API_SECRET` — já implementado no middleware existente do bot-backend.

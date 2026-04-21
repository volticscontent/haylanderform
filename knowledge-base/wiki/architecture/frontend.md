---
title: Arquitetura do Frontend — BFF Pattern
type: architecture
tags: [frontend, nextjs, bff, proxy]
updated: 2026-04-20
status: current
---

# Arquitetura do Frontend

## Padrão BFF (Backend for Frontend)

O frontend Next.js é um **cliente leve**. Toda lógica pesada está no `bot-backend`.

```
Browser → Next.js (Server Components / Server Actions)
                ↓
          backendGet/backendPost (lib/backend-proxy.ts)
                ↓
          bot-backend Express (porta 3001)
                ↓
          PostgreSQL / Redis / Serpro / Evolution API
```

**Nunca** conecta direto ao DB. **Nunca** acessa Redis. **Nunca** chama Serpro.

## Estrutura de Rotas Admin

```
src/app/(admin)/
├── layout.tsx              ← Auth check + AdminSidebar
├── dashboard/              ← Charts, métricas leads
├── atendimento/            ← Chat WhatsApp (Socket.io)
├── lista/                  ← LeadList com filtros
├── reuniao/                ← Agenda (lista + calendário)
├── serpro/                 ← Consultas Serpro + histórico
│   └── documentos/
├── integra/                ← Integra Contador (MÓDULO 4)
│   ├── empresas/           ← CRUD empresas
│   ├── dashboard/          ← Métricas robôs + guias
│   ├── robos/              ← Config e trigger manual
│   ├── guias/              ← DAS, DARF gerados
│   └── caixa-postal/       ← Mensagens Receita Federal
├── configuracoes/          ← Geral + serviços + colaboradores
└── docs/                   ← Documentação interna
```

## Padrões de Página

**Server Component + Server Action (padrão Integra):**
```tsx
// page.tsx — busca dados no servidor
export default async function Page() {
  const data = await listarEmpresas()   // Server Action → backendGet
  return <EmpresasClient data={data} />
}

// EmpresasClient.tsx — interatividade
'use client'
export function EmpresasClient({ data }) {
  const [pending, startTransition] = useTransition()
  // mutations via Server Actions (criarEmpresa, atualizarEmpresa...)
}
```

**Proxy Helper (`lib/backend-proxy.ts`):**
```ts
backendGet('/api/integra/empresas')
backendPost('/api/integra/robos/pgmei/executar', body)
// → fetch para BOT_BACKEND_URL com x-api-key header
```

## Autenticação

Cookie `admin_session` verificado em cada Server Component via `verifyAdminSession()`.
Colaboradores têm `permissoes[]` que filtram quais links aparecem no sidebar.

## Real-time (Socket.io)

Página `/atendimento` conecta ao socket do bot-backend (`haylander-bot-events`).
Eventos recebidos: `new_message`, `lead_update`, `agent_response`.

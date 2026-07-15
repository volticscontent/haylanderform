# Haylander Form

CRM/ERP + automação de WhatsApp voltado para contabilidade de MEIs.

## Estrutura do Monorepo

Este repositório é organizado como um monorepo com três pacotes:

| Pacote | Stack | Descrição |
|--------|-------|-----------|
| `/` | Next.js 16 + React 19 + TypeScript | Painel administrativo (frontend) |
| `bot-backend` | Node.js + Express + TypeScript + BullMQ | Backend do bot, filas, CRON e integrações |
| `socket-server` | Node.js + Socket.io | Servidor WebSocket standalone para eventos em tempo real |

## Pré-requisitos

- Node.js >= 20
- pnpm (recomendado) ou npm
- PostgreSQL
- Redis
- Conta/evolução na Evolution API (WhatsApp)

## Setup

```bash
# Instalar dependências de todos os pacotes
pnpm install

# Iniciar frontend
pnpm dev

# Iniciar backend do bot
pnpm dev:bot

# Iniciar socket server
pnpm dev:socket
```

## Scripts úteis

| Script | Descrição |
|--------|-----------|
| `pnpm dev` | Frontend (Next.js) |
| `pnpm dev:bot` | Backend do bot com hot-reload |
| `pnpm dev:socket` | Socket server com nodemon |
| `pnpm build:bot` | Build do backend |
| `pnpm test:bot` | Testes do backend |
| `pnpm lint:bot` | Lint do backend |

## Documentação

- [Knowledge Base Schema](knowledge-base/CLAUDE.md) — regras da wiki viva do projeto
- [Guia operacional](CLAUDE.md) — contexto histórico e diretrizes de desenvolvimento

## Segurança

- Nunca commite arquivos `.env` ou segredos.
- Certificados e chaves de API devem ser gerenciados via variáveis de ambiente.

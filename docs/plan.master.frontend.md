# plan.master.frontend.md — Unificação e Limpeza (BFF)

> **Status**: Concluído ✅

---

## 🎯 Objetivo Direto
Isolar toda a lógica pesada de negócios e integrações externas dentro do ambiente back-end via Express. Adotar o padrão **BFF (Backend for Frontend)**, transformando o painel de Admin em Next.js em um cliente leve comunicando-se exclusivamente com a API do `bot-backend`. 

---

## 🗑️ 1. O que sai do Frontend (O Fim do Monolito Next.js)
Tornaremos o diretório raiz imune a gargalos do Serverless e vulnerabilidades diretas de DB.
- **Deletar:** A pasta `src/lib/` tem cópias obsoletas de `db.ts`, `redis.ts`, `serpro.ts`, e `evolution.ts`. Serão descartadas.
- **Remover Endpoints Pesados:** Os arquivos lógicos densos mapeados em `/src/app/api/` deixarão de acessar Redis e PostgreSQL diretamente.
- **Desinstalar do `package.json`:** `pg`, `ioredis` e `node-forge`.

---

## 🌐 2. O que entra no Frontend (Proxies HTTP)
Centralizaremos os fluxos de forma passiva.
- Transformar as Rotas da `src/app/api/` em canais *Proxy* que apenas disparam chamadas `fetch(NEXT_PUBLIC_BOT_BACKEND_URL + '/endpoint')` para a API Rest que residirá na porta `4000`.

---

## 🚀 3. O que entra no Bot Backend (Sinal de Autoridade)
O coração lógico que já detinha a base do Whatsapp assumirá tudo.
- **Pasta Controllers:** Estruturar as lógicas em `bot-backend/src/routes/` contendo (`/api/leads`, `/api/serpro`, `/api/services`).
- **Transferência Completa:** A querie bruta de CRM `getFullLeadQuery` virá integralmente para rodar em Node/Express sob nossa instância isolada (Easypanel).
- **Segurança de Borda:** Implementar validação básica via `API_SECRET` impedindo requisições indesejadas no novo Hub REST.

---

## 📋 4. Tarefas de Execução
- [x] Construir as Rotas Rest em Node (`bot-backend/src/routes/` — leads, serpro-api, services, admin, atendimento, settings, colaboradores).
- [x] Mover a Super-Query de `getFullLeadQuery` da Next.js APIRoute para o Controller do bot-backend.
- [x] Fazer as substituições na UI e nas Server Actions para usar o proxy do BFF (`src/lib/backend-proxy.ts`).
- [x] Executar remoção das libs legadas do projeto-raiz (`db.ts`, `redis.ts`, `serpro.ts`, `evolution.ts`, `server-tools.ts`, `socket.ts`, `serpro-db.ts`, `chat-history.ts`).
- [x] `npm uninstall pg ioredis node-forge` — removido com sucesso, `tsc --noEmit` passa em ambos os projetos.

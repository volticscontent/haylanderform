# Arquitetura do Sistema Integrado - Haylander

Este documento descreve a arquitetura atual do ecossistema Haylander, um sistema voltado para atendimento automatizado, qualificação de leads e regularização fiscal via WhatsApp, substituindo lógicas antigas de n8n por uma arquitetura escalável baseada em Node.js e filas.

## 1. Visão Geral da Arquitetura Atual

O sistema foi modularizado a partir de um monolito Next.js para separar a interface administrativa (Frontend) da inteligência e processamento de mensagens pesadas (Bot Backend).

### Componentes Principais:
1. **Frontend Admin (Next.js)**: Painel administrativo, visualização de chats em tempo real e controle de disparos em massa.
2. **Bot Backend (Node.js + Express + BullMQ)**: O coração lógico do atendimento. Processa webhooks da Evolution API, roteia agentes de IA, gerencia concorrência e filas de envio.
3. **Socket Server**: Subsistema de tempo-real que espelha as mensagens do WhatsApp (Evolution API) e do Bot para a interface em Next.js.
4. **PostgreSQL**: Banco de dados relacional (gerenciado via pool de conexão nas duas aplicações) contendo usuários, leads e tracking de recursos.
5. **Redis**: Banco de dados em memória utilizado tanto para filas do BullMQ quanto para o Pub/Sub do Socket.io.

---

## 2. O Fluxo de Mensagens (Webhook e Processamento)

Diferente da arquitetura anterior baseada predominantemente no **n8n**, o processamento de mensagens recebidas agora ocorre **nativamente no Bot Backend**.

### Ciclo de Vida de uma Mensagem
1. **Recepção**: A Evolution API envia o evento `messages.upsert` para o endpoint `/webhook/whatsapp` no Bot Backend.
2. **Registro e Roteamento Inicial**: A mensagem é logada no banco de dados e notificada via Redis Pub/Sub ao servidor de WebSockets para aparecer no Frontend imediatamente.
3. **Debounce (BullMQ)**: Para evitar que a Inteligência Artificial responda a múltiplas mensagens picadas prematuramente (flood do usuário), a mensagem entra em uma Fila de Debounce (espera ~1.5s após a última mensagem).
4. **Agentes de IA (Apolo / Icaro / Atendente)**: 
   - Ao estourar o debounce, o estado do usuário é consultado no banco. O usuário cai com o SDR (Apolo), Closer (Icaro), ou Suporte (Atendente).
   - O agente gera uma resposta (frequentemente segmentada em múltiplas mensagens de texto contendo delimitadores `|||`).

5. **Envio (Fila de Mensagens / Message Queue)**: 
   - A resposta do agente entra em uma nova fila BullMQ (`message-sending`) que cadencia o envio sequencial via Evolution API, imitando um humano digitando (com delays intercalados).
   - Isso elimina antigos problemas de timeout da Vercel (onde requisições ficavam presas por > 10s no Next.js).

---

## 3. Substituição do n8n

Anteriormente, o n8n era responsável por "Split-out" (segmentação de mensagens) e fallbacks automáticos, recebendo as mensagens do Next.js via webhook.

**A nova arquitetura removeu o n8n do fluxo primário (conversacional) pelos seguintes motivos e soluções:**
- **Controle de Estado Inconsistente**: Substituído por locks atômicos no Redis durante o *debounce*.
- **Timeout e Tratamento de Erros**: O BullMQ possui retentativas embutidas nativas (`backoff: exponential`) diretamente no backend do bot.
- **Divisão de Texto (Split-out)**: A IA agora usa strings multi-parte que a fila `message-queue.ts` consome, repassando um a um para a Evolution API.

> *Nota: O n8n ainda é passível de ser utilizado para disparos em massa, conforme sugerido pelo endpoint de callback em `src/app/api/disparos/callback/route.ts`.*

---

## 4. Sistema de Tracking e Regularização (MEI / e-CAC)

A integração e tracking persistem na tabela `resource_tracking` onde acompanhamos:
- Entrega de recursos (vídeos de tutorial, links).
- Autenticação e validação do e-CAC do governo brasileiro (Regularização fiscal autônoma vs assistida).

O Bot consulta ativamente a situação (CNPJ, Dívida Ativa) no banco de dados para determinar se envia formulários Next.js ou responde em texto puro.

---

## 5. Tempo Real (Socket.io e Pub/Sub)

Para sincronizar o Bot Backend com o Frontend Open-chat, as duas entidades comunicam-se de forma assíncrona:
- **Redis Pub/Sub (`haylander-chat-updates`)**: O Bot Backend publica as mensagens aqui.
- **Frontend App**: Conecta-se a um servidor Socket.io, que é assinante (Subscriber) deste canal Redis. Ao receber a mensagem, o Socket envia eventos globais (`chat-update-global`, `new-message`) diretamente aos navegadores logados no painel.

---

## 6. Logs e Observabilidade

O Backend do Bot usa um logger customizado que gera artefatos de logs granulares para:
- Atividade principal de Webhook (`webhookLogger`)
- Estado e retentativas das Filas do BullMQ (`queueLogger`)
- Processamento e Falhas de inteligência IA (`debounceLogger`)

Assim como os logs de Next.js. Comandos essenciais agora residem separados: `start` no Next.js para renderização de React Server Components e rotas normais, e instâncias separadas de PM2 / Docker para o Bot Backend (express + BullMQ workers).
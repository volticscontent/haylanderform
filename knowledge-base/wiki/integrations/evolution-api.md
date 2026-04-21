---
title: Integração Evolution API — WhatsApp
type: integration
tags: [evolution, whatsapp, webhook, socket]
updated: 2026-04-20
status: current
---

# Evolution API

## Função

Ponte entre o bot e o WhatsApp. Gerencia instâncias, webhooks e envio de mensagens.

**Arquivo:** `bot-backend/src/lib/evolution.ts`

## Fluxo de Entrada

```
WhatsApp → Evolution API → POST /api/webhook/whatsapp
                                ↓
                          Validação apikey
                                ↓
                          Normaliza remoteJid → telefone
                          (LID remoteJid resolvido via lid-map.ts)
                                ↓
                          Debounce Queue (BullMQ)
                                ↓
                          message-debounce.ts → agente
```

## Envio de Mensagens

```ts
evolutionSendTextMessage(phone, text)
evolutionSendMediaMessage(phone, mediaUrl, caption, type)
```

Mensagens longas são segmentadas via delimitador `|||` no prompt.
Cada segmento é enviado com delay para simular digitação humana.

## LID (Linked ID)

Evolution API às vezes envia `remoteJid` como LID numérico em vez de `55...@s.whatsapp.net`.
`lid-map.ts` mantém cache Redis (`lid:{lid}` → phone normalizado).
`warmLidCache()` pré-carrega o mapa no boot do servidor.

## Keep-Alive

Cron a cada minuto verifica conexão. Se inativo > 2min ou estado != `open`, chama `evolutionConnectInstance()`.
Jitter de 0-15s antes de reconectar para evitar thundering herd.

## Envio Outbound (Disparo)

`evolutionFindChats()` — lista chats disponíveis.
`checkWhatsAppNumbers(phones[])` — valida se números têm WhatsApp antes de disparar.

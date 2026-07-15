---
title: Jornada Comercial — Chegada ao Agendamento
type: feature
tags: [comercial, apolo, whatsapp, regularizacao, reuniao, ecac]
created: 2026-04-26
updated: 2026-04-26
status: current
---

# Jornada Comercial — Chegada ao Agendamento

## Fluxo Completo

```
Chegada
  ↓
Cadastro via bot (enviar_lista_enumerada + update_user)
  ↓
Avisar sobre e-CAC (iniciar_fluxo_regularizacao)
  ↓
  ├─ Opção A: Procuração e-CAC
  │     ↓
  │   enviar_processo_autonomo → [cliente faz e-CAC]
  │     ↓
  │   verificar_serpro_pos_ecac → marcar_procuracao_concluida
  │     ↓
  │   consultar_pgmei_serpro (Camada 1)
  │
  └─ Opção B: Recusa e-CAC → WhatsApp
        ↓
      iniciar_coleta_situacao_whatsapp
        ↓
      Coleta conversacional: CNPJ → Razão Social → CPF → faturamento → tem_divida
        ↓ (via update_user a cada resposta)
      enviar_link_reuniao  ← proativo ao completar CNPJ + faturamento + tem_divida
        ↓
      update_user { status_atendimento: "reuniao_pendente" }
```

## Status de Cada Etapa

| Etapa | Status | Arquivo |
|-------|--------|---------|
| Chegada (lead criado, pushName) | ✅ | `message-debounce.ts` |
| Menu inicial (lista enumerada) | ✅ | `workflow-comercial.ts` |
| Qualificação (faturamento/dívida) | ✅ | `COMERCIAL_RULES` |
| Avisar sobre e-CAC | ✅ | `iniciar_fluxo_regularizacao` |
| Opção A — envio instrução e-CAC | ✅ | `createAutonomoMessageSegments()` |
| Verificação pós-e-CAC | ✅ | `verificar_serpro_pos_ecac` |
| Opção B — coleta in-chat | ✅ (adicionado 2026-04-26) | `iniciar_coleta_situacao_whatsapp` |
| Agendamento proativo pós-coleta | ✅ (adicionado 2026-04-26) | `COMERCIAL_RULES` |

## Bugs Corrigidos (2026-04-26)

### 1. Duplicate `update_user` em workflow-comercial.ts
- **Problema:** `getComercialTools()` definia `update_user` com schema `{campos: {object}}`, conflitando com a versão de `getSharedTools()` que usa params flat.
- **Fix:** Removido de `workflow-comercial.ts`. Apenas `enviar_lista_enumerada` e `enviar_link_reuniao` permanecem.

### 2. Duplicate `interpreter` em workflow-comercial.ts
- **Problema:** Mesma tool duplicada do shared-agent, causando tool list com dois `interpreter`.
- **Fix:** Removido de `workflow-comercial.ts`.

### 3. Opção B redirecionava para formulário externo
- **Problema:** `createRegularizacaoMessageSegments()` dizia "formulário seguro" com CPF+Senha GOV.
- **Fix:** Texto reescrito como "Conversa pelo WhatsApp". `iniciar_coleta_situacao_whatsapp` envia `createSituacaoFormSegments()` e instrui o agente a coletar dados conversacionalmente.

### 4. URL de vídeo tutorial fictional
- **Problema:** `createAutonomoMessageSegments()` referenciava `haylander.com.br/videos/procuracao-ecac-tutorial.mp4` (não existe).
- **Fix:** Segmento de vídeo removido. Substituído por instrução textual: "Outros > Outorgar Procuração".

### 5. Reunião não disparada proativamente após coleta
- **Problema:** `enviar_link_reuniao` só era chamado quando o cliente pedia explicitamente.
- **Fix:** Regra adicionada em `COMERCIAL_RULES`: ao concluir coleta Opção B (CNPJ + faturamento + tem_divida), disparar `enviar_link_reuniao` proativamente + `update_user { status_atendimento: "reuniao_pendente" }`.

## Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `bot-backend/src/ai/regularizacao-system.ts` | Opção B reescrita; `createSituacaoFormSegments()` adicionado; `createAutonomoMessageSegments()` sem vídeo |
| `bot-backend/src/ai/agents/apolo/workflow-comercial.ts` | Removidos `update_user` e `interpreter` duplicados; regra proativa de reunião adicionada |
| `bot-backend/src/ai/agents/apolo/workflow-regularizacao.ts` | `iniciar_coleta_situacao_whatsapp` adicionado; `REGULARIZACAO_RULES` atualizado com fork Opção A/B |

## Regra de Qualificação (Referência)

```
Faturamento ≤ 5k  +  SEM dívida     → DESQUALIFICADO
Faturamento > 10k                   → MQL
tem_divida = true                   → MQL
Quer abrir empresa (não cair na 1)  → MQL
Resto                               → DESQUALIFICADO
```

---
title: Integração Serpro — Integra Contador
type: integration
tags: [serpro, mtls, oauth, pgmei, cnd, caixa-postal]
updated: 2026-04-20
status: current
---

# Integração Serpro

## Autenticação

**mTLS + OAuth 2.0 (client_credentials)**

```
.pfx (certificado digital) → extraído para cert.pem + key.pem (em memória)
          ↓
POST /token (client_credentials) com mTLS
          ↓
Bearer token (cache em memória, renovado automaticamente)
          ↓
GET /api-serpro/... com Authorization: Bearer {token}
```

**Arquivo:** `bot-backend/src/lib/serpro.ts`

Credenciais em `.env`:
- `SERPRO_CONSUMER_KEY`
- `SERPRO_CONSUMER_SECRET`
- `SERPRO_PFX_BASE64` (certificado em base64)
- `SERPRO_PFX_PASSPHRASE`

**Regra crítica:** Nunca apagar o `.pfx` sem que os Secrets estejam operacionais.

## Serviços Disponíveis

| Serviço | Descrição | Camada Bot |
|---|---|---|
| `PGMEI` | Guias DAS MEI + situação PGFN | Camada 1 (padrão) |
| `CND` | Certidão Negativa de Débitos | Camada 2 |
| `CAIXAPOSTAL` | Mensagens da Receita Federal | Integra módulo |
| `PGDASD` | Declaração Simples Nacional | Integra módulo |
| `SITFIS` | Situação Fiscal | Avançado |

## Presets por Regime (Integra Contador)

```ts
const PRESETS = {
  mei:       ['PGMEI', 'CCMEI_DADOS', 'CAIXAPOSTAL'],
  simples:   ['PGDASD', 'DEFIS', 'CND', 'CAIXAPOSTAL'],
  presumido: ['DCTFWEB', 'SICALC', 'SITFIS', 'CND', 'CAIXAPOSTAL'],
  real:      ['DCTFWEB', 'SICALC', 'SITFIS', 'CND', 'CAIXAPOSTAL'],
}
```

## Fluxo Bot (Camadas de Segurança)

```
Cliente menciona dívida
    ↓
iniciar_fluxo_regularizacao() → Opção A (Procuração e-CAC) | Opção B (Acesso Direto)
    ↓ (Opção A)
enviar_processo_autonomo() → envia link e-CAC + vídeo tutorial
    ↓
[cliente faz e-CAC]
    ↓
verificar_serpro_pos_ecac() → confirma procuração no sistema gov
    ↓
marcar_procuracao_concluida()
    ↓
consultar_pgmei_serpro() → Camada 1 (PGMEI + PGFN)
    ↓ (se necessário)
consultar_divida_ativa_serpro() → Camada 2 (dívida completa)
```

**Restrição absoluta:** Nenhuma consulta Serpro sem procuração e-CAC confirmada.

## Workers BullMQ (Integra Contador)

Cada worker busca empresas ativas com o serviço habilitado em `servicos_habilitados`:

| Worker | Fila | Concorrência | Backoff |
|---|---|---|---|
| `job-pgmei.ts` | `integra-pgmei` | 3 empresas/lote | exponential 5s, 3 tentativas |
| `job-cnd.ts` | `integra-cnd` | 3 empresas/lote | exponential 5s, 3 tentativas |
| `job-caixa-postal.ts` | `integra-caixa-postal` | 3 empresas/lote | exponential 5s, 3 tentativas |

Intervalo de 1500ms entre lotes para evitar throttle da Serpro.

## Agendamento Automático

Cron roda a cada hora `:00`. Dispara robôs onde:
- `integra_robos.ativo = true`
- `dia_execucao = dia_atual_do_mes`
- `hora_execucao = hora_atual`

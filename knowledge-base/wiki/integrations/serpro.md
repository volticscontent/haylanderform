---
title: Integração Serpro — Integra Contador
type: integration
tags: [serpro, mtls, oauth, pgmei, cnd, caixa-postal]
updated: 2026-04-23
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

## Serviços Disponíveis (22 serviços — auditados 2026-04-26)

### Dados Cadastrais
| Serviço | Descrição | Camada Bot |
|---------|-----------|------------|
| `CCMEI_DADOS` | Dados cadastrais completos do MEI (nome, situação, CNAE, empresário.cpf) | Camada 2 |
| `SIMEI` | Enquadramento SIMEI | — |
| `PROCURACAO` | Verifica se há procuração e-CAC ativa | Verificação |

### Guias e DAS (PGMEI)
| Serviço | Parâmetros extras | Camada Bot |
|---------|-------------------|------------|
| `PGMEI` | — | Camada 1 |
| `PGMEI_EXTRATO` | `ano`, `mes` (obrigatórios) | — |
| `PGMEI_BOLETO` | `ano`, `mes` (obrigatórios) | — |
| `PGMEI_ATU_BENEFICIO` | `ano` | — |

### Situação Fiscal (CPF-based — exige CPF do empresário)
| Serviço | Descrição |
|---------|-----------|
| `SIT_FISCAL_SOLICITAR` | Passo 1: retorna `protocoloRelatorio` |
| `SIT_FISCAL_RELATORIO` | Passo 2: relatório completo com protocolo |

### Declarações
| Serviço | Parâmetros extras |
|---------|-------------------|
| `DASN_SIMEI` | `ano` (exercício anterior) |
| `PGDASD` | `numeroDas` (requer consulta prévia) |
| `DCTFWEB` | `ano`, `categoria` |

### Parcelamentos
| Serviço | Descrição |
|---------|-----------|
| `PARCELAMENTO_MEI_CONSULTAR` | Consulta parcelamentos MEI |
| `PARCELAMENTO_MEI_EMITIR` | Emite boleto parcelamento MEI |
| `PARCELAMENTO_SN_CONSULTAR` | Consulta parcelamentos Simples Nacional |
| `PARCELAMENTO_SN_EMITIR` | Emite boleto parcelamento SN |

### Dívida Ativa / PGFN
| Serviço | Descrição |
|---------|-----------|
| `DIVIDA_ATIVA` | Alias de PGMEI com versaoSistema='2.4' |
| `PGFN_CONSULTAR` | Alias de PGMEI com versaoSistema='1.0' |

### Certidão e Outros
| Serviço | Descrição | CPF-based? |
|---------|-----------|------------|
| `CND` | Certidão Negativa de Débitos (requer protocolo SITFIS) | Sim |
| `PROCESSOS` | Consulta processos administrativos | Não |
| `CAIXA_POSTAL` | Mensagens da Receita Federal | Não |
| `PAGAMENTO` | Consulta pagamentos | Não |

## Presets por Regime (Integra Contador)

```ts
const PRESETS = {
  mei:       ['PGMEI', 'CCMEI_DADOS', 'CAIXAPOSTAL'],
  simples:   ['PGDASD', 'DEFIS', 'CND', 'CAIXAPOSTAL'],
  presumido: ['DCTFWEB', 'SICALC', 'SITFIS', 'CND', 'CAIXAPOSTAL'],
  real:      ['DCTFWEB', 'SICALC', 'SITFIS', 'CND', 'CAIXAPOSTAL'],
}
```

## Fluxo Bot (Camadas de Segurança) — atualizado 2026-04-26

```
Cliente menciona dívida
    ↓
iniciar_fluxo_regularizacao() → Opção A ou Opção B

  ─ Opção A (Procuração e-CAC) ──────────────────────────────────
  enviar_processo_autonomo() → link e-CAC + instruções textuais
      ↓
  [cliente faz e-CAC: Outros > Outorgar Procuração]
      ↓
  verificar_serpro_pos_ecac() → confirma procuração
      ↓
  marcar_procuracao_concluida()
      ↓
  consultar_pgmei_serpro() → Camada 1 (PGMEI + PGFN)
      ↓ (se necessário)
  consultar_ccmei_serpro | consultar_situacao_fiscal_serpro | consultar_cnd_serpro | consultar_caixa_postal_serpro

  ─ Opção B (recusou e-CAC — sem formulário externo) ────────────
  iniciar_coleta_situacao_whatsapp()
      ↓
  Coleta conversacional: CNPJ → Razão Social → CPF → faturamento → tem_divida
      ↓ (update_user a cada dado)
  enviar_link_reuniao() ← proativo ao completar CNPJ + faturamento + tem_divida
```

**Restrição absoluta:** Nenhuma consulta Serpro (Camada 1 ou 2) sem procuração e-CAC confirmada.
Exceção: `iniciar_coleta_situacao_whatsapp` — não acessa o Serpro, apenas coleta dados conversacionalmente.

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

## Armadilhas Conhecidas (2026-04-23)

### 1. SITFIS/CND exige CPF obrigatório
`SIT_FISCAL_SOLICITAR`, `SIT_FISCAL_RELATORIO` e `CND` são CPF-based no Integra Contador. Sempre passar `options.cpf` (CPF do empresário). Sem CPF → throw explícito desde 2026-04-23.

### 2. CND é fluxo de 2 etapas
```
1. SIT_FISCAL_SOLICITAR  → retorna { protocoloRelatorio: "..." }
2. CND com options.protocoloRelatorio  → emite certidão
```
Não é possível chamar CND diretamente sem o protocolo.

### 3. PGMEI_EXTRATO / PGMEI_BOLETO precisam de ano + mês
Sempre passar `options.ano` e `options.mes` ao emitir DAS. Sem eles, `periodoApuracao` fica ausente no payload → erro Serpro 400.

### 4. DIVIDA_ATIVA e PGFN_CONSULTAR são aliases de PGMEI
Os três chamam `PGMEI`/`DIVIDAATIVA24` por padrão. Diferença: `PGFN_CONSULTAR` usa `versaoSistema: '1.0'` (sem override), `PGMEI`/`DIVIDA_ATIVA` usam `'2.4'`. Override via env vars dedicadas.

### 5. Falha em massa = procuração ausente
Se quase todos os serviços falham para um CNPJ, verificar:
1. `leads_processo.procuracao_ativa` no banco
2. Chamar serviço `PROCURACAO` para confirmar e-CAC
3. Certificado `.pfx` válido e `CONTRATANTE_CNPJ` correto

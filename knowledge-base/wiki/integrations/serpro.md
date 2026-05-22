---
title: Integração Serpro — Integra Contador
type: integration
tags: [serpro, mtls, oauth, pgmei, cnd, caixa-postal]
updated: 2026-05-15
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
| `PGFN_API` | API avulsa Consulta Dívida Ativa da União, com token OAuth próprio e parser estruturado de inscrições/valores |

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

### 4. PGFN agora usa API avulsa da Serpro (2026-05-15)
A consulta de Dívida Ativa/PGFN não deve mais ser tratada como serviço interno do Integra Contador. O fluxo correto usa a API independente `Consulta Dívida Ativa da União`, com token OAuth próprio e base URL própria.

Variáveis do `bot-backend/.env`:
```env
PGFN_TOKEN_URL=https://gateway.apiserpro.serpro.gov.br/token
PGFN_BASE_URL=https://gateway.apiserpro.serpro.gov.br/consulta-divida-ativa-df/api
PGFN_CLIENT_ID=...
PGFN_CLIENT_SECRET=...
```

Implementação: `bot-backend/src/lib/pgfn.ts`. O Integra Contador continua responsável por PGMEI, CND, SITFIS, Caixa Postal e Procuração.

**Frontend/Admin (2026-05-15):** a tela Serpro expõe apenas `PGFN_API` para Dívida Ativa. Os aliases legados `DIVIDA_ATIVA` e `PGFN_CONSULTAR` foram removidos do catálogo visual para evitar fallback indevido para `DIVIDAATIVA24`.

### 5. Falha em massa = procuração ausente
Se quase todos os serviços falham para um CNPJ, verificar:
1. `leads_processo.procuracao_ativa` no banco
2. Chamar serviço `PROCURACAO` para confirmar e-CAC
3. Certificado `.pfx` válido e `CONTRATANTE_CNPJ` correto

### 6. DIVIDAATIVA24 v2.4 retorna PDF em vez de JSON (bug corrigido 2026-05-06)
O campo `dados` pode ser um PDF em base64 em vez de JSON estruturado. Isso ocorre para CNPJs com débitos em algumas versões do serviço. A IA recebia a string base64 como opaca e concluía "sem dívidas" (falso negativo crítico).

**Solução implementada em `workflow-regularizacao.ts`:**
- `parseSerproData()` tenta `JSON.parse(dados)` primeiro
- Se falhar → `pdf-parse` extrai o texto do PDF base64
- `detectarDebitosNoPdf()` detecta palavras-chave de dívida no texto extraído
- IA recebe `tem_debitos_detectado: true/false/null` + `texto_pdf` legível

**Regra no prompt:** IA só afirma "sem dívidas" com `tem_debitos_detectado === false` explícito em PGMEI e PGFN.

**⚠️ GAP ABERTO (2026-05-09 — ADR-014):** `consultar_divida_ativa_serpro` (Camada 2) ainda NÃO usa `parseSerproData`. PDFs de DIVIDA_ATIVA via Camada 2 continuam chegando como base64 opaco para a IA. Fix pendente.

**⚠️ GAP ABERTO:** `detectarDebitosNoPdf` escaneia apenas primeiros 800 chars do texto extraído. Débitos após esse ponto são invisíveis para a IA. Aumentar para 2500 chars.

### 7. PGMEI é exclusivo para MEI
Serviços `PGMEI`, `PGMEI_EXTRATO`, `PGMEI_BOLETO` são válidos apenas para empresas enquadradas como MEI. Chamar para Simples Nacional retorna erro. O bot deve verificar `is_mei = true` antes de recomendar Camada 1.

### 8. `ADMIN_PHONES` tem default hardcoded com números reais
`workflow-regularizacao.ts:17` inclui números de telefone reais como fallback. Se env var ausente em produção, qualquer consulta desses números bypassa validação de procuração. Remover defaults e falhar explicitamente se env var ausente.

## Estudo PGFN (2026-05-09)

### Diagnóstico atual (código)
- `PGMEI` continua no Integra Contador para débitos DAS MEI e segue consultando os últimos 6 anos.
- PGFN/Dívida Ativa passa a usar cliente independente em `bot-backend/src/lib/pgfn.ts`, com `PGFN_TOKEN_URL`, `PGFN_BASE_URL`, `PGFN_CLIENT_ID` e `PGFN_CLIENT_SECRET`.
- Camada 1 (`consultar_pgmei_serpro`) consolida PGMEI por ano + PGFN por devedor no mesmo retorno `COM_DEBITO | SEM_DEBITO | INCONCLUSIVO`.
- O parser (`parseSerproData`) segue dedicado ao envelope do Integra Contador; PGFN avulsa usa detecção própria baseada no JSON retornado pela API de Dívida Ativa.
- Frontend Admin ainda expõe PGFN no agrupamento de serviços da tela Serpro, mas sem painel dedicado de leitura por inscrição/valor.

### Riscos identificados
- **Multi-empresa:** em pontos de sincronização de procuração ainda existem consultas por `leads.cnpj` sem considerar `cnpj_ativo/lead_empresa`, com risco de marcação no lead incorreto.
- **Doc drift:** documentação interna antiga da API ainda descreve serviços/nomes já superados pelo catálogo atual.

### Recomendações (prioridade)
1. Padronizar resolução multi-empresa em todas as sincronizações (priorizar `cnpj_ativo` e vínculo em `lead_empresa`).
2. Manter `PGFN_API` como único serviço visual de Dívida Ativa no Admin.
3. Revisar payloads avançados de `CAIXA_POSTAL`, `DCTFWEB`, `PAGAMENTO` e `DASN_SIMEI` conforme contratos/autorizações reais.
4. Atualizar documentação técnica de frontend (`src/lib/docs/serpro-api.ts`) para refletir serviços e fluxos reais do backend.

### Relacionados
- [[ADR-014-apolo-agent-audit-2026-05]]
- [[ADR-015-multi-empresa-pgfn-array-fix]]
- [[log]]

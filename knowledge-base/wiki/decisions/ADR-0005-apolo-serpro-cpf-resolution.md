---
title: "ADR-0005: CPF Auto-Resolution para Serviços Serpro CPF-Based"
type: decision
tags: [serpro, cpf, sitfis, cnd, ccmei, apolo]
date: 2026-04-26
status: accepted
---

# ADR-0005: CPF Auto-Resolution para Serviços Serpro CPF-Based

## Contexto

`SIT_FISCAL_SOLICITAR`, `SIT_FISCAL_RELATORIO` e `CND` exigem o CPF do empresário (pessoa física), não o CNPJ da empresa. O bot nunca coletava esse CPF explicitamente no fluxo conversacional, causando falha silenciosa em todas essas consultas.

## Decisão

Criar helper `resolveEmpresarioCpf(cnpj)` que extrai automaticamente o CPF do campo `empresario.cpf` dentro da resposta de `CCMEI_DADOS`. Esse CPF é então passado automaticamente para os serviços CPF-based.

**Não** pedir o CPF ao cliente conversacionalmente — isso seria friction desnecessária e o dado já existe no Serpro.

## Por que CCMEI_DADOS?

`CCMEI_DADOS` é o único serviço Serpro que retorna dados do empresário (pessoa física) a partir do CNPJ. Ele já estava implementado e funcionando na Camada 2.

## Consequências

**Positivo:**
- Todos os 5 serviços de Camada 2 passam a funcionar sem input adicional do usuário
- Fluxo SITFIS 2-etapas agora é transparente para o bot (protocolo extraído e repassado automaticamente)
- `extractSitfisProtocolo()` lida com variações de nome de campo entre versões do Serpro

**Negativo:**
- Uma chamada extra ao Serpro (`CCMEI_DADOS`) antes de cada serviço CPF-based
- Se `CCMEI_DADOS` falhar, os serviços CPF-based falham por cascata

## Alternativas Rejeitadas

- **Pedir CPF ao cliente:** Friction, privacidade, e o dado já existe na API
- **Salvar CPF no banco:** Complexidade de sincronização; Serpro é a fonte de verdade

## Armadilha de Implementação

`CCMEI_DADOS` retorna o payload principal como JSON *string* dentro do campo `dados`, não como objeto. Sempre deserializar:

```ts
const dadosRaw = envelope.dados;
const dados = typeof dadosRaw === 'string' ? JSON.parse(dadosRaw) : dadosRaw;
const cpf = dados?.empresario?.cpf;
```

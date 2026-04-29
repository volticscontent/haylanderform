---
name: ADR-001 — Procuração e-CAC Obrigatória
description: Decisão de tratar a procuração e-CAC como requisito técnico, não como opção comercial
type: decision
date: 2026-04-29
status: accepted
---

# ADR-001: Procuração e-CAC é Obrigatória

## Contexto

O serviço de contabilidade digital requer acesso aos sistemas da Receita Federal (Serpro) em nome do cliente. Isso só é possível com procuração eletrônica ativa no portal e-CAC.

Havia uma versão anterior do prompt do Apolo que apresentava a procuração como "Opção A" e continuava o fluxo sem ela em "Opção B", o que gerava inconsistência e leads mal qualificados.

## Decisão

A procuração e-CAC é **requisito técnico e obrigatório**, não uma opção. O bot deve:

1. Apresentar a procuração como necessidade (não como favor ou conveniência)
2. Explicar o motivo: "para acessar seus dados fiscais **sem precisar da sua senha**"
3. Oferecer fallback apenas se o cliente recusar: simulação de valores com dados que o próprio cliente forneça
4. Se recusar procuração E simulação → `red_flag(PROCURACAO_RECUSADA)`

## Consequências

**Positivas:**
- Leads que chegam à reunião já têm a procuração — reunião é só para fechar contrato
- Elimina caso de uso impossível (trabalhar sem acesso ao Serpro)
- Posiciona o serviço como técnico e profissional

**Negativas:**
- Alguns leads que recusariam a procuração no início podem ser perdidos antes de qualificar
- Mitigado: procuração é simples (5 minutos) e o bot guia o passo a passo com vídeo

## Alternativas Consideradas

- Procuração como opcional (rejeitado: inviabiliza o serviço core)
- Procuração apenas para planos Premium+ (rejeitado: o Basic também precisa emitir DAS)

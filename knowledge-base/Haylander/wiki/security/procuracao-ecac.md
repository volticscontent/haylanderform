---
name: Procuração e-CAC
description: Obrigatoriedade, processo e contexto da procuração eletrônica no portal e-CAC da Receita Federal
type: security
updated: 2026-04-29
---

# Procuração e-CAC

## Por que é Obrigatória

A procuração e-CAC é **requisito técnico**, não opção comercial. Sem ela:
- Não é possível consultar dívidas (PGMEI, PGFN) no Serpro em nome do cliente
- Não é possível emitir guias (DAS, DARF) automaticamente
- Não é possível verificar situação fiscal na Receita Federal
- Não é possível acessar Caixa Postal da Receita

A abordagem do bot: explicar com clareza e empatia — "Preciso dessa autorização para conseguir trabalhar no seu CNPJ com segurança, **sem precisar da sua senha**."

## Dados do Escritório (para o passo a passo)

- **CNPJ do escritório**: 51.564.549/0001-40
- **Portal e-CAC**: ecac.receita.fazenda.gov.br
- **Vídeo tutorial**: (URL Instagram configurada em `system_settings.video_ecac`)

## Passo a Passo para o Cliente

1. Acesse ecac.receita.fazenda.gov.br com conta gov.br
2. Menu: Acesso Delegado → Delegar Acesso a Terceiros
3. Busque pelo CNPJ 51.564.549/0001-40
4. Selecione as permissões (Emissão DAS, Consulta Dívidas, Caixa Postal)
5. Confirme a procuração com a senha do gov.br
6. Aguarde processamento (até 24h em alguns casos)

O bot envia esse passo a passo via `createAutonomoMessageSegments`, que inclui:
- Segmento 1: link do vídeo Instagram (reel de tutorial)
- Segmento 2: instruções formatadas com CNPJ do escritório

## Verificação de Status

Após procuração ativa, o bot pode consultar via Serpro endpoint de procurações.
`consultarCnpjPublico` retorna `procuracao_ativa: boolean` como parte da ficha.

## Integração com o Fluxo

```
Cliente informa CNPJ
  → BrasilAPI (dados públicos)
  → Serpro verifica procuração
  
Se AUSENTE:
  → Bot orienta processo e-CAC
  → Envia vídeo + passo a passo
  → Aguarda confirmação
  
Se ATIVA:
  → Serpro: PGMEI, PGFN, CND, Caixa Postal
  → Bot apresenta diagnóstico completo
```

## Decisão Arquitetural

Ver [ADR-001: Procuração Obrigatória](../decisions/ADR-001-procuracao-obrigatoria.md).

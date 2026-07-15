---
name: BrasilAPI — Integração CNPJ
description: Consulta de dados públicos de CNPJ via BrasilAPI com auto-preenchimento da ficha do lead
type: integration
updated: 2026-05-13
---

# BrasilAPI — CNPJ

## Propósito

Quando o lead informa o CNPJ, o bot consulta a BrasilAPI para obter dados públicos e preencher a ficha automaticamente — sem precisar perguntar ao cliente. Esta é a nossa **solução padrão para consultas simples de CNPJ**, reservando a API do Serpro (Integra Contador) exclusivamente para consultas fiscais e sensíveis que exigem autenticação.

## Decisão Arquitetural

**Por que não usar o Serpro para consulta simples de CNPJ?**
- **Custo e Limites:** A Brasil API é gratuita e sem rate-limits restritivos para dados públicos, enquanto o Serpro possui custos por requisição ou cotas de tráfego.
- **Isolamento de Domínio:** BrasilAPI lida com "Identificação Pública" (Camada 0 do atendimento comercial). Serpro lida com "Diagnóstico Fiscal" (Camada 1 e 2).
- **Sem Autenticação Prévia:** A BrasilAPI não exige Procuração e-CAC para trazer razão social e natureza jurídica.

## Endpoint

```
GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}
```

## Dados Extraídos

| Campo BrasilAPI | Campo na Ficha | Uso |
|---|---|---|
| `razao_social` | `nome_completo` / `empresa` | Confirmar identidade |
| `municipio` + `uf` | `cidade` | Contexto geográfico |
| `cnae_fiscal_descricao` | `tipo_negocio` | Apresentação e qualificação |
| `email` | `email` | Contato alternativo |
| `natureza_juridica` | Detecção MEI | Ver abaixo |
| `situacao_cadastral` | Verificação de atividade | Se BAIXADA/INAPTA → regularização |
| `ddd_telefone_1` | — | Não usado diretamente |

## Detecção de MEI

MEI é identificado pelo código de natureza jurídica **213-5** (Empresário Individual):
```typescript
const isMei = data.natureza_juridica?.includes('213-5') ?? false;
```

Se `is_mei = false`, o bot informa que o serviço é especializado em MEI.

## Auto-Preenchimento

`consultarCnpjPublico(cnpj, userPhone)` em `server-tools.ts`:
1. Consulta BrasilAPI
2. Monta objeto `ficha_auto_preenchida`
3. Chama `updateUser` silenciosamente (sem indicar ao LLM que chamou)
4. Retorna para o bot: `is_mei`, `situacao_cadastral`, `procuracao_ativa`, `instruction`

O preenchimento é **silencioso** — o bot só confirma os dados com o cliente, não diz "preenchei sua ficha".

## Dados Públicos vs Dados Sensíveis

BrasilAPI acessa apenas **dados públicos** (Receita Federal público). Não há:
- Dados financeiros
- Histórico de declarações
- Dívidas (esse é o Serpro)
- Dados bancários

## Relação com Serpro

BrasilAPI → dados públicos → auto-fill + detecção MEI
Serpro → dados fiscais restritos → requer procuração e-CAC ativa

## Implementação

`bot-backend/src/ai/server-tools.ts` → função `consultarCnpjPublico`
Tool no agente: `consultar_cnpj_publico` em `workflow-comercial.ts`

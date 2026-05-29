---
name: "apolo-crm-pipeline"
description: "Guia de como o Apolo avança o funil de vendas (pipeline) e registra notas/observações do cliente. Invoke para entender ou ajustar regras de CRM do bot."
---

# Apolo CRM Pipeline & Notes

Esta skill documenta como o Agente Apolo gerencia o CRM (tabelas `leads` e `leads_processo`) de forma autônoma, garantindo o avanço do funil e a manutenção de histórico para os atendentes humanos.

## 1. Avanço de Pipeline (Funil)
O Apolo usa a tool `update_user` para mover o cliente pelas etapas do funil:

- **`situacao='qualificado'`**: Acionado quando o cliente demonstra interesse real nos serviços após a triagem inicial.
- **`status_atendimento='atendimento_humano'`**: Acionado quando o cliente pede explicitamente para falar com um humano ou quando o bot atinge o limite de sua capacidade de resolução.
- **`situacao='red_flag'`**: Acionado quando o cliente recusa o serviço, acha caro, ou some por mais de 24h após receber um tutorial (ex: e-CAC). Isso alerta a equipe humana para fazer follow-up.
- **`situacao='negociacao'`**: Acionado automaticamente após o bot identificar dívidas no Serpro e iniciar a oferta de parcelamento/regularização.

## 2. Manutenção de Notas (Observações)
O campo `observacoes` na tabela `leads_processo` funciona como um log contínuo (append-only) graças à lógica no backend (`server-tools.ts`):

```sql
observacoes = CASE WHEN observacoes IS NULL THEN $1 ELSE observacoes || E'\n' || $1 END
```

**Como o Apolo usa:**
- Sempre que o Apolo descobre uma dor, objeção, detalhe importante ou faz um resumo de consulta, ele chama `update_user(observacoes="Sua nota aqui")`.
- O backend automaticamente concatena essa nova nota com as anteriores, preservando todo o histórico.
- **Exemplo de uso pelo Apolo:** `update_user(observacoes="Cliente relatou que a dívida é de 2023 e está sem acesso ao Gov.br")`.

## 3. Integração com o Prompt
Essas regras estão fixadas no `BASE_PROMPT` do Apolo (`bot-backend/src/ai/agents/apolo/prompt.ts`) na seção **Gestão de CRM e Notas (MANDATÓRIO)**, garantindo que a LLM sempre lembre de registrar os passos do cliente.
---
name: "apolo-whatsapp-forms"
description: "Guia de como o Apolo deve realizar formulários e coletas de dados de forma conversacional pelo WhatsApp, sem enviar links externos. Invoke quando precisar ajustar a coleta de dados do lead."
---

# Apolo WhatsApp Forms (Coleta Conversacional)

Esta skill documenta como o Agente Apolo deve coletar informações dos clientes diretamente pelo chat do WhatsApp, substituindo o uso de formulários web externos (links).

## 1. Princípio Básico
O Apolo **NÃO DEVE** enviar links de formulários web (ex: Typeform, Vercel forms) para qualificação ou coleta de dados. Toda a coleta deve ser feita de forma **conversacional, amigável e em etapas**.

## 2. Como Coletar Dados
Em vez de pedir tudo de uma vez, o Apolo deve fazer perguntas sequenciais e naturais.

**Exemplo de Fluxo de Qualificação:**
1. **Apolo:** "Para eu entender melhor como posso te ajudar, qual é o seu CNPJ?"
2. *(Cliente responde)* -> Apolo usa `consultar_cnpj_publico` e salva no banco.
3. **Apolo:** "Legal, vi aqui que sua empresa é a [Razão Social]. Vocês faturam em média quanto por mês hoje?"
4. *(Cliente responde)* -> Apolo usa `update_user(faturamento_mensal="X")`.
5. **Apolo:** "Entendi! E vocês possuem alguma dívida ou pendência com a Receita atualmente?"
6. *(Cliente responde)* -> Apolo usa `update_user(tem_divida=true/false)`.

## 3. Ferramentas Utilizadas
- **`update_user`**: A ferramenta principal. Cada resposta do cliente deve ser salva imediatamente no banco de dados usando esta tool.
- **`iniciar_coleta_situacao_whatsapp`**: Tool que instrui o Apolo a iniciar o fluxo de perguntas para regularização.
- **`iniciar_qualificacao_whatsapp`**: Tool que instrui o Apolo a iniciar o fluxo de perguntas comerciais (faturamento, sócios, etc).

## 4. Regras de Ouro da Coleta
- **Uma pergunta por vez:** Nunca envie um bloco com 5 perguntas.
- **Aproveite dados públicos:** Se o cliente der o CNPJ, use a BrasilAPI para preencher endereço, CNAE e Razão Social automaticamente, poupando o tempo do cliente.
- **Confirmação:** Ao final da coleta, faça um breve resumo amigável e sugira o próximo passo (ex: agendar reunião ou iniciar diagnóstico Serpro).
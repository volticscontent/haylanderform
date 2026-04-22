---
title: ADR-0003 Refatoração Máquina de Estados (Apolo)
type: decision
tags: [apolo, bot, state-machine, procuracao, onboarding]
created: 2026-04-22
updated: 2026-04-22
---

# Refatoração Cognitiva do Agente Apolo (Máquina de Estados)

## Resumo
A orquestração do Agente Apolo apresentava um bloqueio funcional durante a requisição de Procuração de clientes no portal e-CAC. Ao delegar o envio do link e na sequência a validação sistêmica do Serpro (`verificar_procuracao_status`), o bot entrava numa malha semântica restritiva informando "A procuração ainda está pendente", impossibilitando o passo seguinte crítico do robô: A Coleta de Dados do Onboarding RAG.
A decisão formaliza a implementação de Lazy Verification e Ferramentas Independentes.

## Detalhes do Problema Escalonado
No esquema antigo:
1. Cliente dita intenção -> Apolo envia tutorial.
2. Apolo utiliza, no mesmo segundo, o Serpro pra testar se já deu certo.
3. Serpro responde "Não" -> Apolo assume uma postura bloqueante baseada nas regras de Compliance (não agir sem procuração).

Isso minava completamente a oportunidade de manter uma conversa fluida e capturar variáveis não sigilosas (CNPJ e Razões Sociais) cruciais para o preenchimento dos cadastros via NLP na Dashboard Admin.

## Decisão (State Machine)
Desvinculamos a *Validação da Procuração* da *Abertura de Diálogo*.

O LLM agora possui uma injeção explícita de `COLETA INTELIGENTE DE DADOS DA EMPRESA E CADASTRO`. A diretiva do Apolo passa a ser baseada em Extração Progressiva:
- Quando esbarrar em requisições de e-CAC pendentes pela burocracia, ele manterá a fluidez do engajamento pedindo os dados da empresa "enquanto se resolve a plataforma do governo".

## Learnings
1. Em fluxos longos regidos por LLM, colocar **bloqueios restritivos obrigatórios** nos prompts contamina as tarefas paralelas.
2. É necessário usar "iscas (Tools) semânticas de recompensa" para o modelo saber que a prioridade primária daquele loop é esvaziar os formulários invisíveis no backend, ao passo que a procuração pode rodar assincronamente ou numa Lazy Request ditada pelo lead.

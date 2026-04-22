---
title: Cadastro de Empresa e Orquestração por Bots (Integra Contador)
type: architecture/feature
tags: [bot, integra-contador, company-registration, memory, rag]
updated: 2026-04-22
status: planned
---

# Cadastro de Empresa via Integra Contador & Orquestração por Bots

Este documento descreve as informações registradas atualmente para uma Empresa no módulo Integra Contador, além da **próxima evolução arquitetural** que automatizará esse processo via agentes conversacionais (Bots).

## 1. Estrutura Atual de Cadastro de Empresas
Atualmente, as seguintes informações são armazenadas para gerenciar uma empresa (`IntegraEmpresa`):
*   **Razão Social:** Nome da empresa.
*   **CNPJ:** CNPJ da empresa (14 dígitos númericos).
*   **Regime Tributário:** `mei`, `simples`, `presumido` ou `real`.
*   **Serviços Habilitados:** Funcionalidades do Integra Contador habilitadas para a empresa (preset dinâmico de acordo com o regime). Exemplos: `PGMEI`, `CCMEI_DADOS`, `PGDASD`, `DEFIS`, `CND`, `CAIXAPOSTAL`.
*   **Validade do Certificado:** Monitoramento de expiração de certificado digital.
*   **Observações:** Notas internas.
*   **Ativo/Inativo:** Flag para o runner do BullMQ incluir ou ignorar a empresa.
*   **Lead ID:** Amarração interna ao Lead originário, quando importado.

O cadasto ocorre hoje de maneira:
- **Manual:** Inserção via formulário no painel `EmpresasClient.tsx`.
- **Importação em Lote:** Seleção de *Leads* que contêm CNPJ, os quais assumem um preset padrão (`mei` com seus serviços base).

### Comportamento Atual e Problemas Lógicos Identificados (Apolo)
Durante as validações de orquestração do Agente Apolo (chatbot de Regularização), identificamos um gargalo comportamental crítico de State Machine (Máquina de Estados) entre a obrigatoriedade da Procuração e-CAC e a coleta de dados da empresa:
1. **O Conflito de Regras:** O LLM está instruído a *nunca* consultar o Serpro sem confirmar a procuração. Ele usa as tools `enviar_processo_autonomo` para guiar o cliente e, em seguida, deveria rodar uma coleta passiva de dados da empresa ("Qual o seu CNPJ, Razão Social, Regime?").
2. **O Travamento:** Devido à ansiedade do LLM, logo após mandar o link da procuração, ele tenta usar a tool `verificar_procuracao_status` repetitivamente. Como o lead ainda não fez o processo no portal (pois acabou de receber o aviso), a tool retorna um 'Erro - Procuração Pendente'.
3. **Bloqueio Cognitivo:** O erro na tool domina o *context window* do bot, forçando-o a dar respostas ríspidas (e.g. *"A procuração ainda está pendente, não vamos prosseguir"*), sobrepondo e esquecendo a instrução de tentar **Coletar de Forma Inteligente** (perguntar o CNPJ e o regime enquanto o cliente faz o acesso).

Para sanar isso, o modelo passa por um **Deep Refactoring Cognitivo** (documentado no Plano de Implementação recente) desacoplando a fase de *Onboarding Data Collection* e tornando o uso do medidor de Serpro subordinado (Lazy Verification) ao consentimento humano explícito de "Conclui a procuração".

## 2. Próxima Ação: Automação Conversacional B2B
O próximo marco do módulo prevê que o próprio bot conduza o onboard fiscal/contábil do Lead. 

### Confirmações de Formulários e Coleta de Dados
A orquestração do fluxo transferirá a responsabilidade de form pre-filling para a conversa:
1. **Ativação Inicial:** O bot identifica o potencial lead e questiona dados corporativos. 
2. **Coleta Incremental:** Pede o CNPJ e, via webhook/API Serpro ou Receita, confirma a Razão Social com o usuário.
3. **Determinação Transparente:** Questiona o modelo de apuração/Regime e a disponibilidade de um certificado A1 logando essas respostas como "Confirmação de Formulário".

### Orquestração e Recuperação de Contexto (Context Retrieval)
Para que a coleta de dados seja autêntica e contínua:
*   Os bots utilizarão *RAG* (Retrieval-Augmented Generation) ou carregamento vetorial para reviver interações antigas com aquele telefone.
*   **Querys sequenciais:** O agente checa quais variáveis do form (ex: *Possui Certificado? Regime é Simples?*) ainda estão vazias e as utiliza como âncora nas próximas tratativas com o Lead sem precisar reiniciar o atendimento.

## 3. Dashboard Analysis e Cadastro Automático via Conversa
Do lado do Admin (na Dash do supervisor), passará a existir uma **função de Análise do Cliente**.
-   **Análise Assistida por IA:** Na ficha do Lead/Empresa selecionado, a inteligência consolidará as mensagens já processadas e preencherá uma prévia do `IntegraEmpresa`.
-   **Cadastro e Aceite Mágico:** O usuário administrativo poderá acionar o *Cadastro Automático*, onde o backend agrupa de fato a `memory` do bot e cria a empresa de um modo transparente, gerando auditoria precisa das permissões concedidas pelo Lead no fluxo WhatsApp/Omnichannel.

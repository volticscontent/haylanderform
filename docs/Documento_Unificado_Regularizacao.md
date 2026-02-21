# Documento Unificado: Novo Fluxo de Regularização MEI

Este documento consolida as diretrizes de 7 demandas (Tasks 1 a 7) para reestruturar o fluxo de **Regularização de MEI e Serviços Relacionados**. O objetivo central é **reduzir o atrito inicial** com o cliente, **educar antes de solicitar dados sensíveis** (como a senha GOV), **priorizar a procuração no e-CAC** por segurança e agilidade, e **distribuir as responsabilidades adequadamente entre os 3 agentes (cérebros)** do sistema: **Apolo (SDR/Triagem)**, **Atendente (Suporte)** e **Icaro/Vendedor (Comercial)**.

---

## 🏗️ 1. O Racional das Decisões (O "Porquê")

O fluxo anterior gerava desconfiança porque, ao sinalizar interesse em "Regularização", o bot enviava imediatamente um formulário exigindo a Senha GOV. A reestruturação foi guiada pelos seguintes princípios:

1. **Educação e Confiança Antes da Ação:** Clientes não entregam a senha do GOV.br sem entender o motivo. A IA precisa primeiro explicar *por que* precisa acessar os dados fiscais.
2. **Priorização da Procuração (e-CAC):** É o caminho mais ético, seguro, rápido e que permite automação (IA faz a consulta sozinha). Isso reduz o gargalo no atendimento humano.
3. **Solicitação Inteligente da Senha GOV:** A senha GOV não foi banida, mas tornou-se contextual. Só será pedida se o serviço especificamente exigir (ex: Dar Baixa e Abrir Novo MEI) ou se o cliente se recusar a fazer a procuração e for para o fluxo humanizado.
4. **Filtro Comercial pela IA (Pré-Fechamento):** Antes o Apolo só encaminhava; agora ele pré-qualifica pelo nível de urgência do cliente (ex: MEI excluído: esperar para voltar custa $200 vs. baixar e abrir novo na hora custa $500). Isso separa leads de ticket menor dos de ticket maior logo de cara.

---

## 🤖 2. Divisão no Fluxo dos Agentes (Os 3 Cérebros)

A requisição original dizia *"Não é tudo para o apolo..."*. Com base na análise da arquitetura atual (`apolo.ts`, `atendente.ts`, `vendedor.ts`), o novo fluxo interage com os agentes da seguinte maneira:

### 🧠 Apolo (O SDR e Triagem Inicial)
O Apolo é a linha de frente. Ele é o responsável por:
- **Identificar a Intenção:** Entender se é uma simples consulta de dívidas (Cenário A) ou se envolve baixa/abertura de novo CNPJ (Cenário B).
- **Educação e Venda da "Procuração":** É responsabilidade do Apolo apresentar a procuração no e-CAC como o caminho ideal (mais seguro, mais rápido e sem fila). Ele deve enviar o **Vídeo Tutorial**.
- **Envio do Formulário Adaptável:**
  - *Se o cliente fez a procuração:* Apolo envia o formulário **sem** pedir a senha GOV.
  - *Se for serviço de Baixa + Novo MEI:* Apolo envia o formulário completo, **explicando que a senha GOV é obrigatória** para este serviço.
- **Tratamento Específico de MEI Excluído (Task 7):** Se o cliente é um MEI desenquadrado, Apolo educa sobre as 2 opções de mercado (Esperar pagando $200 vs. Refazer agora por $500) e roteia a partir da escolha.

### 🧠 Atendente (O Suporte Humano / Fallback)
O agente Atendente (ou o humano que o assume) entra no circuito para:
- **Fallback da Procuração:** Se o cliente "travar" no vídeo do e-CAC ou disser que não conseguiu, o Apolo passa a bola para o Atendente.
- **Consultas Manuais:** Como o cliente não fez a procuração, o Atendente humano fará a consulta.
- **Formulário com GOV:** Neste estágio, após o humano contornar a objeção e o cliente decidir fechar o serviço, o Atendente envia o formulário completo, onde a Senha GOV será solicitada para permitir a execução manual.

### 🧠 Icaro / Vendedor (O Especialista Comercial)
Se a IA pré-qualificar o cliente como urgente de ticket alto (ex: o cliente de MEI Excluído que opta pela "Opção 2 - Baixar e Abrir Novo Imediatamente" por R$500), a situação não é mais uma mera "dúvida".
- **Fechamento e Novo Serviço:** O Vendedor assume os leads que indicam novas contratações mais complexas ou que precisam de uma reunião de alinhamento com o especialista humano (Haylander).
- O Icaro usa as informações pré-coletadas pelo Apolo (tipo de serviço e a urgência) para agendar a reunião final de fechamento, sem fricção.

---

## 🗺️ 3. O Mapa da Jornada Consolidada (Passo a Passo)

### Passo 1: O Acolhimento e Diagnóstico (Apolo)
1. Cliente pede "Regularização".
2. **NÃO ENVIAR O FORMULÁRIO AINDA.**
3. Apolo saúda, diz que primeiro é preciso consultar as dívidas, e avalia o cenário do cliente:
   - *Cenário Padrão:* Consulta de Dúvidas / Regularização Simples.
   - *Cenário MEI Excluído:* IA entra com a educação e ancoragem de valores (Opção 1 de R$250 para regularizar e esperar VS Opção 2 de R$500 para baixar e reabrir).
   - *Cenário de Baixa para Reabertura:* Identifica que vai precisar da senha GOV.

### Passo 2: A Escolha da Autorização (Apolo)
1. Apolo introduz a necessidade de consultar os dados e promove a **Procuração no e-CAC** como a via mais segura e sem intervenção humana.
2. Apolo envia o Vídeo Tutorial e pergunta se o cliente conseguiu.

### Passo 3: Bifurcação de Atendimento
**Rota Verde (Sucesso com a Procuração):**
- Apolo avança automaticamente.
- A ferramenta de consulta nos portais federais (PGMEI e PGFN) poderá rodar automaticamente pela IA (Escopo restrito neste primeiro momento, sem municípios/estados).
- Apolo envia o Formulário de Cadastro, instruindo o cliente a **não preencher** a senha GOV, pois a procuração já foi feita.

**Rota Laranja (Dificuldade / Serviço Exige GOV):**
- Se o cliente não conseguiu fazer a procuração, o Apolo transfere para o **Atendente Humano**.
- Se o cliente escolheu o pacote de baixar o MEI e reabrir, o Apolo explica: "Como precisamos encerrar o CNPJ, aqui obrigatoriamente precisamos da sua autorização GOV."
- Em ambos os casos acima, o Formulário enviado contém os campos de Senha GOV.

### Passo 4: O Fechamento
- Com a consulta em mãos (seja via procuração automatizada pelo Apolo ou via humana pelo Atendente), o cliente é conduzido ao pagamento do honorário adequado. Se virar um escopo de consultoria mais denso, é passado para o **Vendedor/Icaro**.

---

## 🎯 4. Conclusão e Resumo de Melhorias

- **UX e Conversão:** A fricção com a senha do governo acaba. Ganhamos a confiança do cliente antes de cobrar os dados.
- **Automação Inteligente:** A adoção maciça da procuração fará os robôs do Antigravity trabalharem sozinhos (PGMEI e PGFN), reduzindo gargalo de ticket-médio do escritório.
- **Comercial Proativo:** Uma IA de atendimento reativo transformou-se num SDR que qualifica e faz *ancoragem de preço* (R$200 vs R$500), entregando para o fechamento um cliente muito mais quente e ciente de sua necessidade.

# Entendendo o Fluxo e as Semelhanças: Apolo vs. Vendedor (Icaro)

## 1. Quais as semelhanças entre o Apolo e o Vendedor?

Embora tenham papéis e missões diferentes dentro do funil de vendas da Haylander, o Apolo (SDR) e o Vendedor (Icaro) possuem semelhanças estruturais e de comportamento por compartilharem o mesmo ecossistema de inteligência artificial:

*   **Tom de Voz e Postura:** Ambos são programados para serem extremamente empáticos, humanos e acolhedores. Eles fogem do padrão "robótico" ou "menu de atendimento chato".
*   **Comportamento de Mensageria:** Ambos utilizam o delimitador `|||` para quebrar as mensagens em partes menores. Isso simula uma pessoa real digitando parágrafos curtos no WhatsApp, em vez de enviar "textões".
*   **Compartilhamento de Memória e Dados:** Ambos leem a mesma base de dados do usuário (faturamento, presença de sócios, tipo de dívida, etc.) através do `<user_data>`, e podem compartilhar o mesmo bloco de anotações usando a ferramenta de intérprete (`interpreter`).
*   **Caixa de Ferramentas:** Ambos possuem permissão para executar tarefas semelhantes, como: atualizar o cadastro do cliente (`update_user`), enviar PDFs ou vídeos (`enviar_midia`) e transferir para um humano quando o bicho pega (`chamar_atendente`).

---

## 2. Temos um fluxo certo?
**Sim, temos um funil desenhado.** O Apolo atua no topo e meio do funil (descoberta, triagem e qualificação). O Icaro atua no fundo do funil (fechamento preliminar e agendamento da reunião).

## O que acontece de verdade em um chat desde que o cliente chega?

Aqui está o passo a passo cronológico do que ocorre quando um novo lead envia um "Oi" no WhatsApp:

### Passo 1: O Cliente Chega e o Apolo (SDR) Assume
*   **A Abordagem:** O cliente manda mensagem. O Apolo entra em cena saudando pelo nome e tentando extrair, de forma amigável, qual a *dor* do cliente.
*   **Diagnóstico Rápido:** Se o cliente não diz o que quer logo de cara, o Apolo exibe um menu enumerado. Se o cliente já diz (ex: "tenho uma dívida no Simples"), o Apolo engata no assunto.
*   **Regras Mentais de Qualificação (O grande filtro):** Discretamente, o Apolo analisa o que o lead diz:
    *   *Faturamento até R$5k e SEM dívida?* = Lead **Desqualificado**.
    *   *Faturamento acima de R$10k ou TEM dívida complexa?* = Lead **MQL (bom para conversar)**.
*   **O Objetivo do Apolo:** Guiar o cliente para a solução primária. Pode ser iniciar um trâmite automático de regularização autônoma/assistida, *ou* convencer o cliente a preencher o **Formulário de Qualificação**.

### Passo 2: O Bastão é Passado do Apolo para o Icaro (Vendedor)
*   Assim que o cliente chega num patamar onde ele já está qualificado (passou pela triagem e formulário), o sistema tira o Apolo de cena e aciona o **Icaro (Vendedor de Fechamento)**.
*   O Icaro entra no chat *sabendo de tudo* o que o cliente discutiu com o Apolo anteriormente.

### Passo 3: O Icaro Entra para o "Fechamento" (Agendamento)
*   A missão do Icaro não é redigir contratos no WhatsApp nem passar preços fechados de serviços complexos. A missão dele é **agendar a Reunião de Fechamento com o Especialista (Haylander humano)**.
*   **Ação Consultiva:** Icaro dá a segurança que faltava. Ele diz: *"Entendo seu cenário e sabemos como resolver isso. O próximo passo é falarmos com o especialista."*
*   **Agendamento:** Ele utiliza uma ferramenta para enviar o **Link de Agendamento**. Se o lead hesitar ou não quiser usar o link, o Icaro tenta propor uma viabilidade e agendar as datas e horários manualmente, direto na conversa.
*   **A "Repescagem":** Uma regra importante do Icaro é que ele também atua na repescagem de leads que o Apolo jogou no "lixo" (Desqualificados). Ele retoma a conversa para investigar planos futuros e tentar agendar a mesma reunião, tentando não perder o lead.

### Passo 4: Fim da Interação com a IA
*   Seja por um agendamento bem-sucedido (aguardando a reunião com o Haylander real), ou por o lead ser teimoso, a IA aciona o humano responsável ou encerra o fluxo (`finalizar_atendimento_vendas`) e devolve para o Suporte continuar.

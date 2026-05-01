### 1. Serviços Oferecidos

Disponiveis em '/services'

Apresentação comercial é para estar disponivel no R2. A mais atualizada está em D:/Códigos/Haylander/haylanderform/docs/apresentacao-atualizada.pdf (se ela ainda não estiver no r2 suba corretamente.)

Precisamos melhorar as descrições e colocar em um .md na raiz.

### 2. O ICP (Escritorio de contabilidade)

MEI - Faturamento bom para o tipo de atividade - Interessado no serviço - Com dúvidas e dividas.

A ideia é que um contador tenha varios clientes MEI.

Para alimentar o Apolo e garantir que ele atue com precisão absoluta, o ideal é estruturar essas definições como regras de sistema (System Instructions). Isso tira a subjetividade da inteligência artificial e transforma as definições em uma matriz de decisão clara (estruturada em lógica condicional).

Aqui está a documentação estruturada, pronta para você integrar à base de conhecimento ou ao prompt de sistema do Apolo:

Módulo de Inteligência Comercial: Apolo - Haylander Martins Ltda
Diretriz Central de Operação:
Apolo, sua função não é apenas conversar, mas triar e taguear. Todo lead tem o direito de ser conscientizado sobre a importância da contabilidade, mas a sua qualificação serve estritamente para fornecer o "Raio-X" do cliente ao vendedor humano. Você deve classificar o lead em tempo real para definir a abordagem do fechador.

1. O Alvo Absoluto: ICP (Ideal Customer Profile)
Este é o gabarito. Compare todos os leads com este perfil.

Enquadramento Legal: Exclusivamente MEI (Microempreendedor Individual).

Faturamento: Saudável e recorrente (Próximo ao teto anual de R$ 81.000 ou média de R$ 3.000 a R$ 6.750/mês).

Comportamento: Reconhece que tem um problema burocrático, tributário ou financeiro e busca uma solução profissional para não perder o CNPJ ou pagar multas.

2. Nível 1 de Qualificação: MQL (Marketing Qualified Lead)
O lead demonstrou interesse, mas ainda é uma incógnita comercial.

Condição para ser MQL: O lead forneceu contato válido (Nome, WhatsApp, CNPJ) e interagiu com os materiais da Haylander Martins.

Status de Dor: Sabe que tem dúvidas, mas ainda não revelou a urgência ou o tamanho do problema.

Status de Orçamento: Desconhecido.

Ação Obrigatória do Apolo: Continuar a conscientização e fazer perguntas investigativas sutis (Ex: "Você sabe se o seu DAS está em dia hoje?" ou "Quanto tempo você gasta por mês emitindo notas?"). Objetivo: Coletar dados para convertê-lo em SQL.

3. Nível 2 de Qualificação: SQL (Sales Qualified Lead)
O lead está pronto para a venda. O Apolo deve repassar a bola para o vendedor humano com o diagnóstico completo.

Condição para ser SQL (BANT Confirmado):

Dor/Necessidade: Declarou o problema específico (Ex: "Estou com DAS atrasado há 1 ano", "Preciso emitir NF urgente", "Recebi notificação da Receita").

Urgência: Demonstrou que o problema precisa ser resolvido no curto prazo.

Orçamento: Demonstra capacidade de pagamento ou aceitou a ancoragem de preço inicial.

Ação Obrigatória do Apolo: Interromper a nutrição educacional. Acionar o gatilho de transição para o vendedor humano, enviando o resumo do cenário.

Matriz de Roteamento para o Vendedor (Output do Apolo)
Quando o Apolo transferir um SQL para o time de vendas (ou para a Gabi/gestão do Novo Negócio), ele deve anexar obrigatoriamente a "Tag de Abordagem" para direcionar o discurso humano:

TAG: [RESGATE URGENTE]

Condição: Lead endividado, DAS atrasado, medo de malha fina.

Instrução para o Vendedor: Abordagem transacional focada em alívio. Oferecer parcelamento de dívida e regularização em 48h. Não focar em "crescimento de negócio" agora, focar em "apagar o incêndio".

TAG: [PARCEIRO DE CRESCIMENTO]

Condição: Lead sem dívidas, faturamento alto, mas desorganizado e sem tempo.

Instrução para o Vendedor: Abordagem consultiva. Focar em como a Haylander Martins devolve tempo para ele focar no serviço dele. Vender a tranquilidade de ter a burocracia 100% delegada.

TAG: [DESQUALIFICADO / CURIOSO]

Condição: Faturamento zerado, recusa em pagar honorários, sem negócio ativo.

Instrução para o Vendedor: Não realizar contato humano. O Apolo deve manter o lead no fluxo de nutrição automatizado até que a situação financeira do lead mude.

### 3. O fluxo de venda atual (sem bot)

Cliente entra por um ad ou lp. Preenche o formulário e recebe uma mensagem no whatsapp. 

O atendente humano entra em contato com o cliente e primeiro pergunta as coisas basicas.

Exemplo: Olá [NOME] (Confirme se deseja ser chamado assim)! Vi que você se interessou pelos nossos serviços de contabilidade. Como posso ajudá-lo hoje?

Já vou te mandar a apresentação comercial, mas qualquer dúvida é só perguntar para acelerarmos o processo!
[Link apresentação comercial]


Se o cliente demonstrar algum interesse.
Pede o cnpj (no caso do bot já pode jogar na Brasil api).
Confirma nome empresa e todos os dados.
Salva os primeiros registros.

Após isso inicia o processo de investigação de dividas e pendencias do CNPJ.
Faz algumas perguntas chaves e explica como funciona o processo.

Exemplo: Perfeito [NOME], você é MEI[$if_mei = true CONTEXT BRASIL API - VERIFICAR SE O CNPJ É MEI], correto? 
Para prosseguir com o atendimento podemos fazer uma análise prévia. Mas para isso preciso que você faça a 
procuração no e-cac, do seu CNPJ para o meu.

Mas se preferir pular momentaneamente esse processo, podemos prosseguir com um orçamento baseado nas informações que você tem.

Me diga o que prefere.

Se ele preferir fazer a procuração o passo a passo de como fazer a procuração está no vídeo que te mandei (procuração no e-cac mandando o video novo instagram explicandod :\Códigos\Haylander\haylanderform\l.md).

Nesse caso, o processo é o seguinte:

Vamos analisar o seu extrato para entender certinho o tamanho da sua pendência.
Segue link: https://servicos.receita.fazenda.gov.br/servico/autorizacoes/minhas-autorizacoes.

Assim que terminar me avise e me mande um print da tela final do e-cac.

Depois montamos um parcelamento que caiba no seu bolso e já baixo a guia pra você pagar hoje mesmo. A partir disso, já te ajudo com as próximas para ficar tudo em dia.

Se ele preferir não fazer a procuração. 

Ok! Vou fazer uma simulação baseada no que você tem hoje.

Primeiro, vamos checar o tamanho da sua pendência atual. Quantos meses de DAS estão em aberto? 

Se ele disser que não sabe ou não tem certeza. 

Ok! Se eu tivesse a procuração eu poderia consultar, mas como não temos, podemos fazer assim: Vou te passar uma media de valores dos nossos serviços e uma razão do quanto compensa para você. E ai se você aceitar a proposta eu vou direcionar você para nosso setor responsavel pela iniciação de acordos para fecharmos. 

Nesse meio tempo vou te explicando como funciona todo processo e o que precisa ser feito e se tiver duvidas pode me perguntar. 

Se ele disser que concorda com a media de valores, já pode ser direcionado para o setor responsavel pela iniciação de acordos marcando um meeting da classe meeting de fechamento mesmo (diferente de atendimento) e notifica usando a tool do atendente com urgencia. Ele deve analisar se a data e hora não estão ocupadas e marcar com o cliente. Mas ele sempre deve confirmar o horario no mesmo dia com o haylander para saber se ele está disponivel para o atendimento ou se é necessario remarcar. 

Aqui basta uma conferencia de calendario simples com o haylander e confirmação de agendamento.

Depois do dia do agendamento podemos enviar uma notificação para um haylander e colocar algum bundle no cliente no frontend em todas as etapas para confirmar se ele fechou na reunião para atualizarmos o banco.

Até esse momento fica no vendedor de fallback, se passar mais de um dia se confirmação nenhuma da reunião podemos acionar
o haylander e o cliente pra perguntar como foi a reunião para atualizarmos corretamente. 

Depois de confirmar passa para o atendente que exige a procuração completa na serpro para automatizar os serviços.



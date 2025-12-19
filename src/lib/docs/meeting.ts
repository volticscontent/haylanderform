
export const meeting = {
    title: 'Agendamento de Reuniões',
    content: `
      ## Visão Geral
      O módulo de agendamento (\`/reuniao\`) é uma interface simplificada focada em conversão final. Ele permite que leads já cadastrados agendem uma conversa técnica diretamente com um especialista via WhatsApp.

      A página foi desenhada para ser acessada através de links enviados em campanhas de remarketing ou automações pós-qualificação.

      ---

      ## Fluxo de Agendamento

      \`\`\`mermaid
      sequenceDiagram
          participant User as Usuário
          participant Page as Página (/reuniao/[phone])
          participant API as API (/api/user)
          participant Wpp as WhatsApp (Link)

          User->>Page: Acessa Link da Campanha
          Note right of User: Link contém o telefone

          Page->>API: GET /api/user/[phone]
          alt Usuário Encontrado
              API-->>Page: Dados do Lead (Nome, Status)
              Page->>User: Exibe Saudação Personalizada
          else Usuário Não Encontrado
              API-->>Page: 404 Not Found
              Page->>User: Redireciona para Home
          end

          User->>Page: Clica em "Agendar Reunião"
          
          Page->>Wpp: Redireciona com mensagem pré-definida
          Note right of Wpp: "Olá, sou [Nome]. Gostaria de agendar..."
      \`\`\`

      ## Detalhes Técnicos

      ### Rota Dinâmica
      - **Arquivo**: \`src/app/reuniao/[phone]/page.tsx\`
      - **Parâmetro**: \`phone\` (Número de telefone do lead, usado como chave de busca).

      ### Componentes
      - **Loading State**: Exibe um esqueleto de carregamento enquanto busca os dados do usuário.
      - **Error Handling**: Se o telefone não existir no banco, o sistema faz um redirecionamento suave (soft redirect) para a página inicial de cadastro, assumindo que pode ser um novo visitante.

      ### Integração com WhatsApp
      A URL do WhatsApp é gerada dinamicamente utilizando a API universal (\`wa.me\`).

      **Formato da Mensagem:**
      > "Olá, me chamo **{nome_do_lead}**. Gostaria de agendar uma reunião para regularizar meu MEI."

      Isso permite que o atendente identifique imediatamente o lead no CRM ao receber a mensagem, cruzando o nome com o número de telefone do remetente.

      ---

      ## Painel Administrativo

      ### Visualização de Agenda
      O sistema conta com um módulo administrativo dedicado para gestão de reuniões (`/admin/atendimentos`).

      **Funcionalidades:**
      - **Calendário Mensal**: Visualização intuitiva com indicadores de dias ocupados.
      - **Detalhes Diários**: Lista lateral com todos os agendamentos do dia selecionado.
      - **Dados Exibidos**: Nome do lead, telefone, horário e observações.
      - **Navegação**: Controles para navegar entre meses e atalho para o dia atual.

      **Integração de Dados:**
      Os dados são puxados diretamente da tabela `leads_vendas`, filtrando registros onde `data_reuniao` não é nulo.

      ---

      ## Resumo Técnico - Meeting Module
      - **Renderização**: Server Component (Page) + Client Component (Interaction).
      - **SEO**: NoIndex (Página de conversão privada).
      - **Data Fetching**: Fetch nativo com \`cache: 'no-store'\` para dados frescos.
      - **UX**: Fallback automático para Home se ID inválido.
    `
}

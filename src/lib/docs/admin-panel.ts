export const adminPanel = {
    title: 'Painel Administrativo',
    content: `
      ## Visão Geral
      O Painel Administrativo (\`/admin\`) é o centro de comando do Haylander CRM. É uma área restrita destinada à gestão de leads, configuração de disparos e análise de métricas.

      O acesso é protegido por autenticação baseada em sessão (cookies) e todas as operações sensíveis são validadas no servidor.

      ---

      ## Estrutura do Dashboard

      ### 1. Métricas (KPIs)
      Cards de visualização rápida no topo da página:
      - **Total de Leads**: Contagem absoluta da base.
      - **Conversão**: % de leads qualificados vs. total.
      - **Faturamento Estimado**: Soma do potencial dos leads em negociação.
      - **Status do Bot**: Monitoramento de uptime do agente Apolo.

      ### 2. Lista de Leads (Tabela Interativa)
      O componente central da gestão.
      - **Filtros**: Por Status, Dívida, Data de Cadastro.
      - **Ações Rápidas**: Editar, Excluir, Enviar Mensagem.
      - **Paginação**: Server-side pagination para performance.

      ---

      ## Fluxo de Autenticação

      \`\`\`mermaid
      sequenceDiagram
          participant Admin as Administrador
          participant Login as "Página Login"
          participant Server as "Server Action"
          participant Cookie as "Browser Cookie"
          participant Middleware as Middleware

          Admin->>Login: Insere Senha Mestra
          Login->>Server: POST (Server Action)
          Server->>Server: Valida Hash da Senha
          
          alt Senha Correta
              Server->>Cookie: Set admin_session (HttpOnly)
              Server-->>Login: Redireciona /admin/dashboard
          else Senha Incorreta
              Server-->>Login: Erro "Credenciais Inválidas"
          end

          Note over Middleware: Em cada navegação:
          Admin->>Middleware: Acessa rota /admin/*
          Middleware->>Cookie: Verifica admin_session
          alt Sem Sessão
              Middleware-->>Admin: Redireciona /admin/login
          end
      \`\`\`

      ## Tecnologias e Componentes

      ### Shadcn UI + Tailwind
      Utilizamos componentes modernos para garantir acessibilidade e beleza.
      - \`DataTable\`: Para listagem de leads com ordenação.
      - \`Dialog\`: Modais para edição rápida sem sair da página.
      - \`Toast\`: Notificações de feedback (Sucesso/Erro).

      ### Server Actions
      Todas as mutações de dados (Delete, Update) utilizam Server Actions do Next.js 14, garantindo que a lógica de banco de dados nunca seja exposta ao cliente (browser).

      Example:
      \`\`\`typescript
      // actions/update-lead.ts
      'use server'
      
      export async function updateLead(id: string, data: FormData) {
        const session = cookies().get('admin_session')
        if (!session) throw new Error('Unauthorized')
        
        // ... Lógica de Update no DB
        revalidatePath('/admin') // Atualiza a UI instantaneamente
      }
      \`\`\`

      ---

      ## Resumo Técnico - Painel Admin
      - **Renderização**: Híbrida (Server Components para dados, Client Components para interatividade).
      - **Autenticação**: Stateless Session (Cookie HttpOnly + Middleware).
      - **Segurança**: Proteção CSRF implícita nas Server Actions.
      - **Performance**: Streaming de dados com Suspense e Loading UI.
    `
}

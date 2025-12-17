export const disparoApi = {
    title: 'API de Disparos',
    content: `
      ## Visão Geral
      A API de Disparos é responsável por orquestrar o envio de mensagens em massa (Broadcast) através de múltiplos canais, sendo o WhatsApp o principal deles.

      O sistema foi projetado para ser agnóstico ao provedor de mensageria, permitindo futuras integrações com SMS ou E-mail sem alterar a interface de consumo.

      ---

      ## Endpoints

      ### 1. Criar Agendamento de Disparo
      **POST** \`/api/disparos/create\`

      Endpoint principal para iniciar uma campanha de disparos. Suporta agendamento, envio imediato e criação de previews.

      **Payload:**
      \`\`\`json
      {
        "channel": "whatsapp",
        "instance_name": "marketing-01", // Nome da instância na Evolution API
        "body": "Olá {{nome_completo}}! Temos uma oferta especial...",
        "filters": {
          "tags": ["cliente-antigo", "vip"],
          "statusFilter": "pendente",
          "phones": ["5511999999999"] // Opcional: lista explícita
        },
        "schedule_at": "2023-12-25T10:00:00Z", // Opcional
        "status": "scheduled" // 'scheduled' | 'preview' | 'draft'
      }
      \`\`\`

      **Resposta de Sucesso (200):**
      \`\`\`json
      {
        "id": "123",
        "status": "scheduled",
        "created_at": "...",
        "message": "Disparo agendado com sucesso."
      }
      \`\`\`

      ---

      ## Fluxo de Processamento

      \`\`\`mermaid
      sequenceDiagram
          participant Client as "Painel Admin"
          participant API as "API Disparos"
          participant DB as "Banco de Dados"
          participant Process as "Process Worker (/process)"
          participant Evo as "Evolution API"

          Client->>API: POST /create (Payload)
          API->>DB: INSERT INTO disparos
          API-->>Client: 200 OK (ID)
          
          loop Job Cron (a cada min)
              Process->>DB: SELECT * FROM disparos WHERE pending
              Process->>DB: UPDATE status = processing
              
              loop Para cada Lead Filtrado
                  Process->>DB: SELECT dados_lead (Joins)
                  Process->>Process: Replace Placeholders ({{nome}})
                  Process->>Evo: POST /message/sendText/{instance}
                  Evo-->>Process: 200 OK
              end
              
              Process->>DB: UPDATE status = completed
          end
      \`\`\`

      ## Integração Evolution API
      
      O sistema utiliza a **Evolution API** para o envio das mensagens de WhatsApp.
      
      - **Instâncias Dinâmicas**: É possível selecionar qual instância (ex: \`atendimento\`, \`marketing\`, \`vendas\`) fará o envio através do campo \`instance_name\`.
      - **Placeholders**: O corpo da mensagem suporta variáveis dinâmicas baseadas nas colunas do banco de dados (ex: \`{{nome_completo}}\`, \`{{razao_social}}\`).

      ## Regras de Negócio

      - **Janela de 24h**: O sistema verifica automaticamente se houve interação recente para evitar classificar a mensagem como SPAM.
      - **Higienização de Números**: Remove caracteres não numéricos e valida o formato E.164 (DDI + DDD + Número) antes do envio.
      - **Rate Limiting**: Disparos são controlados para não exceder os limites da API do WhatsApp Business.

      ---

      ## Resumo Técnico - API de Disparos
      - **Arquitetura**: Event-Driven (Produtor/Consumidor).
      - **Fila**: Redis (via BullMQ) - *Implementação futura*.
      - **Escalabilidade**: Horizontal (Workers independentes).
      - **Consistência**: Idempotência garantida pelo Job ID.
      - **Segurança**: Validação estrita de payload (Zod).
    `
}

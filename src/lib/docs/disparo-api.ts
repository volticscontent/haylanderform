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

      Endpoint principal para iniciar uma campanha de disparos. Atualmente, ele valida o payload e retorna um ID de confirmação (Stub), mas está preparado para integrar com filas de processamento (Redis/Bull).

      **Payload:**
      \`\`\`json
      {
        "channel": "whatsapp",
        "body": "Olá! Temos uma oferta especial para você...",
        "filters": {
          "tags": ["cliente-antigo", "vip"],
          "last_contact_days": 30
        },
        "schedule_at": "2023-12-25T10:00:00Z" // Opcional
      }
      \`\`\`

      **Resposta de Sucesso (200):**
      \`\`\`json
      {
        "id": "DISP-1702589999999",
        "received": {
          "channel": "whatsapp",
          "body": "...",
          "filters": { ... }
        },
        "status": "queued"
      }
      \`\`\`

      **Erro de Validação (400):**
      \`\`\`json
      {
        "error": "Payload inválido"
      }
      \`\`\`

      ---

      ## Fluxo de Processamento (Planejado)

      \`\`\`mermaid
      sequenceDiagram
          participant Client as "Painel Admin"
          participant API as "API Disparos"
          participant Queue as "Fila (Redis)"
          participant Worker as "Worker Process"
          participant WhatsApp as "WhatsApp Gateway"

          Client->>API: POST /create (Payload)
          API->>API: Validar Filtros e Conteúdo
          API->>Queue: Enfileirar Job (Priority: Normal)
          API-->>Client: 200 OK (Job ID)
          
          loop Processamento em Background
              Worker->>Queue: Pop Job
              Worker->>Worker: Selecionar Leads (DB)
              Worker->>WhatsApp: Enviar Mensagem
              WhatsApp-->>Worker: Status (Sent/Delivered)
              Worker->>DB: Atualizar Histórico do Lead
          end
      \`\`\`

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

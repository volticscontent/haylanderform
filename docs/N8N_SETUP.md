# Configuração do n8n para Haylander

Este guia explica como configurar o n8n para funcionar com o sistema Haylander.

## Pré-requisitos

1. Uma instância do n8n rodando (local ou nuvem).
2. Acesso à interface administrativa do n8n.
3. Chave de API do n8n (para importação automática de workflows).

## Passo 1: Configurar Variáveis de Ambiente

No arquivo `.env` do projeto Haylander, adicione as seguintes variáveis:

```env
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook
N8N_API_KEY=sua_api_key_do_n8n
```

- `N8N_WEBHOOK_URL`: A URL base dos webhooks do seu n8n.
- `N8N_API_KEY`: A chave de API gerada no n8n (Settings > API).
- `API_URL` (Opcional): URL do backend Next.js (padrão: `https://haylanderform.vercel.app`).

## Passo 2: Importar Workflows

Temos um script automatizado para importar os workflows necessários.

1. Certifique-se de que o n8n está rodando.
2. Execute o script de importação:

```bash
npx tsx scripts/import-workflows-n8n.ts
```

Isso irá ler os arquivos da pasta `workflows/` e criar os fluxos no seu n8n.

### Importação Manual (Alternativa)

Se preferir importar manualmente:

1. Abra o n8n.
2. Vá em "Workflows" > "Import from File".
3. Selecione o arquivo `workflows/n8n-mensagem-followup.json`.
4. Salve e ative o workflow.

## Passo 3: Configurar Credenciais no n8n

O workflow importado pode precisar de credenciais para funcionar (ex: Redis, HTTP Request).

1. Abra o workflow importado.
2. Verifique os nós que exigem credenciais (geralmente marcados com um ícone de alerta).
3. Configure as credenciais necessárias (ex: Redis, API do WhatsApp/Evolution).

## Passo 4: Testar Conexão

Para verificar se a integração está funcionando:

```bash
npx tsx scripts/test-n8n-connection.ts
```

Este script enviará uma mensagem de teste para o webhook do n8n. Verifique no n8n se a execução apareceu.

## Estrutura do Workflow Principal

O workflow `n8n-mensagem-followup.json` gerencia:
- Recebimento de mensagens do sistema (para envio ao cliente).
- Recebimento de mensagens do cliente (para resetar timers de follow-up).
- Controle de delay entre mensagens (para simular digitação).
- Lógica de follow-up automático caso o cliente não responda.

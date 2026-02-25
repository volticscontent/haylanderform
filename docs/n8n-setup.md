# Configuração do n8n para Gerenciamento de Mensagens e Follow-up

Este documento descreve como configurar o workflow unificado no n8n para gerenciar o envio de mensagens segmentadas e o timer de follow-up automático.

## Visão Geral

O workflow "Fluxo Unificado - Gerenciador de Mensagens e Follow-up" tem duas responsabilidades principais:
1. **Processamento de Mensagens do Sistema:** Recebe mensagens complexas/segmentadas do backend (Next.js) e as envia sequencialmente para o usuário via API, garantindo a ordem e o delay correto.
2. **Gestão de Follow-up:** Monitora a atividade do usuário. Se o usuário não responder em X minutos (padrão: 2 min) após uma interação do sistema, envia uma mensagem de follow-up. Se o usuário responder, o timer é cancelado.

## Pré-requisitos

- Instância do n8n rodando (local ou nuvem).
- Redis configurado e acessível pelo n8n.
- Variáveis de ambiente configuradas no n8n.

## Variáveis de Ambiente (Aplicação Next.js)

Adicione as seguintes variáveis no arquivo `.env` da sua aplicação Next.js:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `N8N_WEBHOOK_URL` | URL base dos webhooks do n8n | `https://n8n.seudominio.com/webhook` |
| `N8N_API_KEY` | (Opcional) Chave para autenticação no webhook do n8n, se configurado | `sua-chave-secreta-n8n` |

## Variáveis de Ambiente (n8n)

Configure as seguintes credenciais/variáveis no n8n:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `API_URL` | URL base da sua aplicação Next.js (onde está a API de envio) | `https://app.haylander.com.br` ou `http://host.docker.internal:3000` |
| `API_KEY` | Chave de API para autenticação na rota `/api/messages/send` | `sua-chave-secreta-aqui` |

## Webhooks

O workflow expõe dois webhooks POST:

1. **System Message (`/webhook/system-message`)**
   - **Origem:** Backend (Next.js) -> `src/lib/n8n-client.ts`
   - **Payload:**
     ```json
     {
       "phone": "5511999999999",
       "messages": [
         { "content": "Olá", "type": "text", "delay": 1000 },
         { "content": "Tudo bem?", "type": "text", "delay": 1500 }
       ],
       "context": "regularizacao-fiscal",
       "followupMessage": "Olá? Ainda está por aí?" // Opcional
     }
     ```
   - **Ação:** Inicia o envio das mensagens e arma o timer de follow-up.

2. **Client Message (`/webhook/client-message`)**
   - **Origem:** Backend (Next.js) -> `src/app/api/webhook/whatsapp/route.ts`
   - **Payload:**
     ```json
     {
       "phone": "5511999999999"
     }
     ```
   - **Ação:** Cancela qualquer timer de follow-up ativo para este telefone.

## Instalação / Importação

1. Acesse o painel do n8n.
2. Vá em **Workflows** > **Import from File**.
3. Selecione o arquivo `workflows/n8n-mensagem-followup.json` deste repositório.
4. Ative o workflow.

## Funcionamento do Timer (Redis)

O controle de concorrência é feito via Redis para evitar race conditions:
1. Ao iniciar um fluxo de mensagens, um ID único de execução (`followupId`) é gerado e salvo no Redis com a chave `followup:{phone}`.
2. O workflow espera o tempo definido (2 minutos).
3. Após a espera, ele verifica se o ID salvo no Redis ainda é o mesmo da execução atual.
   - Se **SIM**: Significa que o usuário não respondeu (o timer não foi cancelado/sobrescrito). O follow-up é enviado.
   - Se **NÃO**: Significa que o usuário respondeu (chave deletada) ou um novo fluxo iniciou (chave sobrescrita). O follow-up é abortado.

## Testes

### Teste de Envio (Sistema)
```bash
curl -X POST https://seu-n8n.com/webhook/system-message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "messages": [{"content": "Teste 1", "delay": 0}, {"content": "Teste 2", "delay": 2000}]
  }'
```

### Teste de Interrupção (Cliente)
Envie o comando acima e, dentro de 2 minutos, envie:
```bash
curl -X POST https://seu-n8n.com/webhook/client-message \
  -H "Content-Type: application/json" \
  -d '{ "phone": "5511999999999" }'
```
O follow-up NÃO deve ser enviado.

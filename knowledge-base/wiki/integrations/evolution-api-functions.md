# Evolution API (Baileys) - Funções Disponíveis

Este documento lista todas as funções implementadas no arquivo `bot-backend/src/lib/evolution.ts` que interagem com a Evolution API (baseada na biblioteca Baileys do WhatsApp).

## 1. Envio de Mensagens
- **`evolutionSendTextMessage(jid, text)`**: Envia uma mensagem de texto simples para um contato.
- **`evolutionSendMediaMessage(jid, mediaUrl, mediatype, caption, fileName, mimetype)`**: Envia arquivos de mídia (imagem, vídeo, áudio ou documento). Suporta URLs públicas (como as do R2).
- **`evolutionSendWhatsAppAudio(jid, audio)`**: Envia um áudio gravado como mensagem de voz (PTT - Push To Talk).

## 2. Leitura e Histórico
- **`evolutionFindMessages(jid, limit, page)`**: Busca o histórico de mensagens de um chat específico. Usado pelo Apolo para recuperar o contexto da conversa.
- **`evolutionFindChats()`**: Retorna a lista de todos os chats ativos na instância.
- **`evolutionFindContacts()`**: Retorna a lista de contatos salvos/sincronizados na instância, incluindo nome e foto de perfil.

## 3. Manipulação de Mídia Recebida
- **`evolutionGetBase64FromMediaMessage(message)`**: Extrai o base64 de uma mensagem de mídia recebida (usando o objeto da mensagem).
- **`evolutionGetBase64FromMedia(messageId, convertToMp4)`**: Extrai o base64 de uma mídia usando apenas o ID da mensagem. Útil quando o webhook não envia o base64 inline.

## 4. Gerenciamento da Instância
- **`evolutionFetchInstances()`**: Lista todas as instâncias configuradas na Evolution API.
- **`evolutionGetConnectionState()`**: Retorna o status atual da conexão (ex: open, connecting, close).
- **`evolutionConnectInstance()`**: Força a conexão/reconexão da instância.
- **`evolutionUpdateInstanceSettings(settings)`**: Atualiza configurações de comportamento do WhatsApp, como:
  - `rejectCall`: Rejeitar ligações automaticamente.
  - `msgCall`: Mensagem enviada ao rejeitar ligação.
  - `alwaysOnline`: Manter o status "Online".
  - `readMessages`: Marcar mensagens como lidas (visualização azul).
- **`evolutionSetWebhook(config)`**: Configura a URL do webhook e os eventos que a instância deve escutar (ex: `MESSAGES_UPSERT`).

## 5. Utilitários
- **`evolutionGetProfilePic(jid)`**: Busca a URL da foto de perfil atual de um contato.
- **`checkWhatsAppNumbers(numbers)`**: Verifica se uma lista de números possui WhatsApp ativo (retorna o JID correto).
- **`toWhatsAppJid(phone)`**: Converte um número de telefone limpo para o formato JID exigido pela Baileys (ex: `5511999999999@s.whatsapp.net`).
import 'dotenv/config';
import { processIncomingMessage } from '../bot-backend/src/lib/message-processor';

async function run() {
    console.log("Simulando envio de mensagem do usuário para o bot...");

    // Simular payload do webhook da Evolution API
    const payload = {
        event: "messages.upsert",
        instance: "teste",
        data: {
            key: {
                id: "MOCK_MSG_" + Date.now(),
                fromMe: false,
                remoteJid: "69922772283537@lid",
                remoteJidAlt: "553175124875@s.whatsapp.net",
                addressingMode: "lid"
            },
            pushName: "Haylander Martins Contabilidade",
            messageType: "conversation",
            message: {
                conversation: "Consulte o CNPJ 19401379000170 por favor"
            },
            messageTimestamp: Math.floor(Date.now() / 1000),
            instanceId: "8d3cfa72-b133-4647-a0f2-84d32da51441",
            status: "RECEIVED"
        }
    };

    console.log("Processando mensagem...");
    const result = await processIncomingMessage(payload);
    console.log("Resultado do processamento:", result);

    // Esperar um tempo para os workers BullMQ enviarem a mensagem (caso use filas assíncronas)
    console.log("Aguardando 15 segundos para finalização dos jobs assíncronos...");
    await new Promise(resolve => setTimeout(resolve, 15000));

    process.exit(0);
}

run().catch(console.error);

import 'dotenv/config';
import { runApoloAgent } from '../bot-backend/src/ai/agents/apolo/index';
import { getChatHistory } from '../bot-backend/src/lib/chat-history';
import pool from '../bot-backend/src/lib/db';

async function testAgent() {
    console.log("Iniciando teste direto do Agente Apolo...");
    const phone = '553175124875';

    // 1. Obter histórico de chat
    const history = await getChatHistory(phone);
    console.log("Histórico carregado:", history.length, "mensagens.");

    // 2. Chamar o agente com uma mensagem de teste
    const message = "Consulte o CNPJ 19401379000170 por favor";
    console.log("\nEnviando mensagem para o Apolo:", message);

    const context = {
        userId: '69922772283537@lid',
        userName: 'Haylander Martins Contabilidade',
        userPhone: phone,
        history,
        outOfHours: false
    };

    try {
        const response = await runApoloAgent(message, context);
        console.log("\nRESPOSTA DO APOLO:\n", response);
    } catch (err) {
        console.error("\nERRO AO EXECUTAR APOLO:", err);
    }

    process.exit(0);
}

testAgent().catch(console.error);

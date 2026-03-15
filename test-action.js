require('dotenv').config();
const { evolutionFindMessages } = require('./src/lib/evolution');

async function getMessagesTest(jid, page = 1) {
    const response = await evolutionFindMessages(jid, 20, page);
    let records = (response?.messages?.records || (Array.isArray(response) ? response : []));
    
    console.log(`[getMessages ServerAction] Fetched ${records.length} messages`);

    if (Array.isArray(records)) {
      records = await Promise.all(records.map(async (msg) => {
        const content = msg.message || msg;

        // Check for media
        const mediaMsg = content.audioMessage || content.imageMessage || content.videoMessage || content.documentMessage;

        return { id: msg.key?.id, content: content.conversation || content.extendedTextMessage?.text, fromMe: msg.key?.fromMe };
      }));
    }

    return { records };
}

getMessagesTest('553182354127@s.whatsapp.net').then(r => console.log(JSON.stringify(r.records, null, 2))).catch(console.error);

require('dotenv').config();
const { evolutionFindMessages } = require('./src/lib/evolution');

async function testAction() {
    // try to fetch both @s.whatsapp.net and the @lid
    const jids = ['553182354127@s.whatsapp.net', '553182354127:2@lid']; // guessing the lid format
    let allRecords = [];

    for (const singleJid of jids) {
      try {
        const response = await evolutionFindMessages(singleJid, 50, 1);
        const records = (response?.messages?.records || (Array.isArray(response) ? response : []));
        allRecords = [...allRecords, ...records];
      } catch (e) {
        console.error(`Error fetching messages for JID ${singleJid}:`, e.message);
      }
    }

    const uniqueRecordsMap = new Map();
    let dropped = 0;
    for (const r of allRecords) {
      const msgId = r.key?.id || r.keyId || r.id; // updated logic
      if (!msgId) {
        dropped++;
        console.log("DROPPED:", JSON.stringify(r));
      }
      if (msgId && !uniqueRecordsMap.has(msgId)) {
        uniqueRecordsMap.set(msgId, r);
      }
    }
    
    let records = Array.from(uniqueRecordsMap.values());
    console.log(`Total fetched: ${allRecords.length}, Dropped: ${dropped}, Unique: ${records.length}`);
}

testAction();

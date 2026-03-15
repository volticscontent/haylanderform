require('dotenv').config();
const { evolutionFindChats } = require('./src/lib/evolution');

async function run() {
  try {
    const res = await evolutionFindChats();
    // find the chat for 553182354127
    const chats = res || [];
    const targetChats = chats.filter(c => c?.id?.includes('553182354127') || c?.remoteJid?.includes('553182354127'));
    
    console.log(`Found ${targetChats.length} chats matching 553182354127:`);
    for (const c of targetChats) {
      console.log(`- ID: ${c.id}`);
      console.log(`- remoteJid: ${c.remoteJid}`);
      console.log(`- name: ${c.name}`);
      console.log('---');
    }
  } catch(e) {
    console.error(e);
  }
}

run();

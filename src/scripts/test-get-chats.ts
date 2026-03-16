import 'dotenv/config';
import { getChats } from '../app/(admin)/atendimento/actions';

async function test() {
    const res = await getChats();
    if (!res.success) {
        console.error("Failed:", res.error);
        return;
    }
    const chats = res.data || [];
    console.log(`Fetched ${chats.length} chats`);
    chats.slice(0, 5).forEach((c: any) => {
        console.log(`Chat ID: ${c.id}, Name: ${c.pushName}, leadName: ${c.leadName}, evolutionJid: ${c.evolutionJid}`);
    });
    // Check for lid
    const lidChats = chats.filter((c: any) => String(c.id).includes('lid') || String(c.evolutionJid).includes('lid') || String(c.pushName).includes('lid'));
    console.log(`Found ${lidChats.length} LID chats.`);
    if (lidChats.length > 0) {
        console.log("LID Chats:");
        console.log(lidChats);
    }
    
    // Check duplicates
    const ids = chats.map((c: any) => c.id);
    const duplicates = ids.filter((item: any, index: any) => ids.indexOf(item) !== index);
    console.log(`Found ${duplicates.length} duplicate IDs:`, duplicates);
}

test();

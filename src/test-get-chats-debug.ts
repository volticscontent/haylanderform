import 'dotenv/config';
import { getChats } from './app/(admin)/atendimento/actions';

async function test() {
    console.log("Testing getChats...");
    const res = await getChats();
    if (!res.success) {
        console.error("FAILED GETCHATS:", res.error);
    } else {
        console.log(`Fetched ${res.data?.length} chats`);
    }
}
test();

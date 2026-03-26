import 'dotenv/config';
import { getMessages } from './app/(admin)/atendimento/actions';

async function test() {
    console.log("Testing getMessages...");
    const jid = "553182354127@s.whatsapp.net";
    const res = await getMessages(jid);
    if (!res.success) {
        console.error("Failed:", res.error);
        return;
    }
    const records = (res.data?.messages?.records || (Array.isArray(res.data) ? res.data : [])) as any[];
    console.log(`Fetched ${records.length} messages`);
    if(records.length > 0) {
        console.log(records[0]);
    }
}
test();

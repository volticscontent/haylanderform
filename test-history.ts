require('dotenv').config();
const { evolutionFindMessages } = require('./src/lib/evolution');

async function run() {
  const jid = '553182354127@s.whatsapp.net'; // The number from the screenshot
  console.log(`Fetching messages for ${jid}...`);
  try {
    const res = await evolutionFindMessages(jid, 50, 1);
    console.log(JSON.stringify(res, null, 2));
  } catch(e) {
    console.error(e);
  }
}

run();

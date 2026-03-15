require('dotenv').config();
const { evolutionFindMessages } = require('./src/lib/evolution');
async function run() {
  const response = await evolutionFindMessages('553182354127@s.whatsapp.net', 50, 1);
  const records = response?.messages?.records || (Array.isArray(response) ? response : []);
  console.log(JSON.stringify(records, null, 2));
}
run();

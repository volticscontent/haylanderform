require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query("SELECT * FROM \"Contact\" WHERE \"remoteJid\" LIKE '%553182354127%'");
    console.log("Contacts:", JSON.stringify(res.rows, null, 2));

    const chatRes = await pool.query("SELECT * FROM \"Chat\" WHERE \"remoteJid\" LIKE '%553182354127%'");
    console.log("Chats:", JSON.stringify(chatRes.rows, null, 2));

  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

run();

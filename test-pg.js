require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query("SELECT * FROM \"Message\" WHERE \"remoteJid\" LIKE '%553182354127%' ORDER BY \"messageTimestamp\" DESC LIMIT 20");
    console.log("Messages:", JSON.stringify(res.rows, null, 2));

  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

run();

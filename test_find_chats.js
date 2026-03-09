const axios = require('axios');

async function testFindChats() {
    try {
        const res = await axios.post(
            'https://evolutionapi.landcriativa.com/chat/findChats/haylander-bot',
            {},
            { headers: { apikey: 'B6D711FCDE4D4FD5936544120E713976' } }
        );
        const chats = res.data;
        console.log("Total chats:", chats.length);
        if (chats.length > 0) {
            console.log("Sample chat 1:", JSON.stringify(chats[0], null, 2));
            console.log("Sample chat 2:", JSON.stringify(chats[1], null, 2));
            console.log("Sample chat 3:", JSON.stringify(chats[2], null, 2));
        }
    } catch (err) {
        console.error(err.response ? err.response.data : err.message);
    }
}

testFindChats();

const fetchChats = async () => {
    try {
        const response = await fetch('https://evolutionapi.landcriativa.com/chat/findChats/teste', {
            method: 'POST',
            headers: {
                apikey: 'isfEQhkHq5tnvAa04A6VMisTec8JbvGW',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        const data = await response.json();
        const chatsArray = Array.isArray(data) ? data : data.records || data.chats || [];
        if (chatsArray.length > 0) {
            console.log("Keys of the first chat object:", Object.keys(chatsArray[0]));
            console.log("Full first object:", JSON.stringify(chatsArray[0], null, 2));
        }
    } catch (error) {
        console.error("Error:", error);
    }
};
fetchChats();

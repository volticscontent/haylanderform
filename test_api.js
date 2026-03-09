const baseUrl = 'https://evolutionapi.landcriativa.com';
const apikey = 'isfEQhkHq5tnvAa04A6VMisTec8JbvGW';
const instance = 'teste';

async function run() {
    console.log("Batendo na API...", baseUrl);
    try {
        const res = await fetch(`${baseUrl}/chat/findChats/${instance}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey }
        });

        console.log("HTTP:", res.status);
        if (!res.ok) {
            console.error(await res.text());
            return;
        }

        const data = await res.json();
        console.log("Total Chats:", data.length);
        if (data.length > 0) {
            console.log("Objeto Real do Chat 0:", JSON.stringify(data[0], null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}
run();

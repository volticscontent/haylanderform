const baseUrl = 'https://evolutionapi.landcriativa.com';
const apikey = 'isfEQhkHq5tnvAa04A6VMisTec8JbvGW';
const instance = 'teste';

async function run() {
    console.log("Batendo na API...", baseUrl);
    try {
        const res = await fetch(`${baseUrl}/chat/findContacts/${instance}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey }
        });

        console.log("HTTP:", res.status);
        if (!res.ok) {
            console.error(await res.text());
            return;
        }

        const data = await res.json();
        console.log("Total Contacts:", data.length);
        if (data.length > 0) {
            console.log("Amostra 01 (Nome):", data[0].pushName || data[0].name);
            console.log("Amostra 01 (Pic):", data[0].profilePictureUrl || data[0].profilePicUrl || "Nulo");
            console.log("Amostra JSON:", JSON.stringify(data[0], null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}
run();

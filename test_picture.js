const baseUrl = 'https://evolutionapi.landcriativa.com';
const apikey = 'isfEQhkHq5tnvAa04A6VMisTec8JbvGW';
const instance = 'teste';

async function run() {
    console.log("Batendo na API...", baseUrl);
    try {
        const res = await fetch(`${baseUrl}/chat/fetchProfilePictureUrl/${instance}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey },
            body: JSON.stringify({ number: "553182354127" })
        });

        console.log("HTTP:", res.status);
        if (!res.ok) {
            console.error(await res.text());
            return;
        }

        const data = await res.json();
        console.log("Picture Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();

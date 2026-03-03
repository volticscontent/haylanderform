export type ColaboradorSession = {
    id: number;
    nome: string;
    email: string;
    permissoes: string[];
};

function getSecretKey(): string {
    const key = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
    if (!key) {
        throw new Error('[SEGURANÇA] Configure ADMIN_SESSION_SECRET ou ADMIN_PASSWORD no .env');
    }
    return key;
}

async function getKey() {
    const encoder = new TextEncoder();
    return crypto.subtle.importKey(
        'raw', encoder.encode(getSecretKey()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
}

export async function signAdminSession(payload?: ColaboradorSession): Promise<string> {
    const encoder = new TextEncoder();
    const key = await getKey();

    const data = JSON.stringify({
        ...payload,
        ts: Date.now(),
    });

    const dataB64 = btoa(encodeURIComponent(data));
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(dataB64));
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return `${dataB64}.${signatureHex}`;
}

export async function verifyAdminSession(sessionValue: string | undefined | null): Promise<boolean> {
    const session = await getSession(sessionValue);
    return session !== null;
}

export async function getSession(sessionValue: string | undefined | null): Promise<ColaboradorSession | null> {
    if (!sessionValue) return null;

    const parts = sessionValue.split('.');
    if (parts.length !== 2) return null;
    const [dataB64, signatureHex] = parts;

    const encoder = new TextEncoder();

    let key;
    try {
        key = await getKey();
    } catch {
        return null;
    }

    const expectedBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(dataB64));
    const expectedArray = Array.from(new Uint8Array(expectedBuffer));
    const expectedHex = expectedArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Comparação timing-safe (evita timing attacks)
    if (signatureHex.length !== expectedHex.length) return null;
    let mismatch = 0;
    for (let i = 0; i < signatureHex.length; i++) {
        mismatch |= signatureHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    try {
        const decoded = JSON.parse(decodeURIComponent(atob(dataB64)));

        // Expiração: 24h
        const age = Date.now() - (decoded.ts || 0);
        if (age > 24 * 60 * 60 * 1000) return null;

        // Se não tem id, é sessão legada (admin master)
        if (!decoded.id) {
            return {
                id: 0,
                nome: 'Administrador',
                email: 'admin',
                permissoes: ['admin'],
            };
        }

        return {
            id: decoded.id,
            nome: decoded.nome,
            email: decoded.email,
            permissoes: decoded.permissoes || [],
        };
    } catch {
        return null;
    }
}

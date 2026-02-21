export async function signAdminSession(): Promise<string> {
    const encoder = new TextEncoder();
    const secretKey = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'default_super_secret_key';
    const key = await crypto.subtle.importKey(
        'raw', encoder.encode(secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );

    const timestamp = Date.now().toString();
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp));
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return `${timestamp}.${signatureHex}`;
}

export async function verifyAdminSession(sessionValue: string | undefined | null): Promise<boolean> {
    if (!sessionValue) return false;
    const parts = sessionValue.split('.');
    if (parts.length !== 2) return false;
    const [timestamp, signatureHex] = parts;

    const encoder = new TextEncoder();
    const secretKey = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'default_super_secret_key';
    const key = await crypto.subtle.importKey(
        'raw', encoder.encode(secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );

    const expectedBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp));
    const expectedArray = Array.from(new Uint8Array(expectedBuffer));
    const expectedHex = expectedArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (signatureHex !== expectedHex) return false;

    // Expiration: 24h
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > 24 * 60 * 60 * 1000) return false;

    return true;
}

const BACKEND = (process.env.BOT_BACKEND_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');

function buildHeaders(extra?: HeadersInit): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(process.env.BOT_BACKEND_SECRET ? { 'x-api-key': process.env.BOT_BACKEND_SECRET } : {}),
    ...(extra || {}),
  };
}

export async function backendGet(path: string, searchParams?: URLSearchParams) {
  const url = `${BACKEND}${path}${searchParams && searchParams.toString() ? `?${searchParams}` : ''}`;
  return fetch(url, { headers: buildHeaders() });
}

export async function backendPost(path: string, body: unknown, extraHeaders?: HeadersInit) {
  return fetch(`${BACKEND}${path}`, {
    method: 'POST',
    headers: buildHeaders(extraHeaders),
    body: JSON.stringify(body),
  });
}

export async function backendPut(path: string, body: unknown) {
  return fetch(`${BACKEND}${path}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
}

export async function backendDelete(path: string) {
  return fetch(`${BACKEND}${path}`, { method: 'DELETE', headers: buildHeaders() });
}

export interface SitfisResult {
  pdfBase64: string;
  protocolo: string;
  tempoEspera: number;
}

const FETCH_TIMEOUT_MS = 60_000;

function withTimeout(ms: number): AbortSignal {
  return AbortSignal.timeout(ms);
}

function parseMaybeJson(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null) return value as Record<string, unknown>;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as Record<string, unknown>; } catch { return null; }
  }
  return null;
}

/**
 * Executes the 2-step SITFIS flow: solicitar → wait → relatorio → return PDF base64.
 * Throws on any error so the caller can show proper feedback.
 * Each fetch has a 60-second timeout.
 */
export async function fetchSitfisRelatorio(cnpj: string): Promise<SitfisResult> {
  const r1 = await fetch('/api/serpro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cnpj, service: 'SIT_FISCAL_SOLICITAR' }),
    signal: withTimeout(FETCH_TIMEOUT_MS),
  });
  const d1 = await r1.json() as Record<string, unknown>;
  if (!r1.ok) throw new Error((d1.error as string) || 'Falha ao solicitar protocolo SITFIS');

  const dados1 = parseMaybeJson(d1.dados);
  const protocolo = String(d1.protocoloRelatorio ?? dados1?.protocoloRelatorio ?? dados1?.protocolo ?? '');
  const tempoEspera = Number(d1.tempoEspera ?? dados1?.tempoEspera ?? 4000);

  if (!protocolo) throw new Error('SIT_FISCAL_SOLICITAR não retornou protocoloRelatorio.');

  await new Promise((resolve) => setTimeout(resolve, Math.max(tempoEspera, 1000)));

  const r2 = await fetch('/api/serpro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cnpj, service: 'SIT_FISCAL_RELATORIO', protocoloRelatorio: protocolo }),
    signal: withTimeout(FETCH_TIMEOUT_MS),
  });
  const d2 = await r2.json() as Record<string, unknown>;
  if (!r2.ok) throw new Error((d2.error as string) || 'Falha ao gerar relatório SITFIS');

  const dados2 = parseMaybeJson(d2.dados);
  const pdfBase64 = String(dados2?.pdf ?? d2.pdf ?? '').trim();
  if (!pdfBase64) throw new Error('Relatório SITFIS sem PDF em base64.');

  return { pdfBase64, protocolo, tempoEspera };
}

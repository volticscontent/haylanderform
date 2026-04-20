import fs from 'node:fs';
import path from 'node:path';

const cnpj = process.argv[2] || '45723564000190';

async function post(body) {
  const response = await fetch('http://127.0.0.1:3001/api/serpro', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: response.status, text, json };
}

function normalizeDados(dados) {
  if (typeof dados === 'string') {
    try {
      return JSON.parse(dados);
    } catch {
      return dados;
    }
  }
  return dados;
}

const s1 = await post({ cnpj, service: 'SIT_FISCAL_SOLICITAR' });
if (s1.status !== 200) {
  throw new Error(`Falha no passo 1: ${s1.text}`);
}

const d1 = normalizeDados(s1.json?.dados);
const protocolo =
  s1.json?.protocoloRelatorio ||
  d1?.protocoloRelatorio ||
  d1?.protocolo;
const tempoEspera = Number(s1.json?.tempoEspera || d1?.tempoEspera || 4000);

if (!protocolo) {
  throw new Error('Sem protocoloRelatorio no passo 1');
}

await new Promise((resolve) => setTimeout(resolve, Math.max(tempoEspera, 1000)));

const s2 = await post({
  cnpj,
  service: 'SIT_FISCAL_RELATORIO',
  protocoloRelatorio: protocolo,
});

if (s2.status !== 200) {
  throw new Error(`Falha no passo 2: ${s2.text}`);
}

const d2 = normalizeDados(s2.json?.dados);
const pdfBase64 = (d2?.pdf || s2.json?.pdf || '').trim();
if (!pdfBase64) {
  throw new Error('Resposta sem campo pdf base64');
}

const outDir = path.resolve('tmp', 'serpro');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `sitfis-${cnpj}-${Date.now()}.pdf`);
fs.writeFileSync(outFile, Buffer.from(pdfBase64, 'base64'));

console.log(`PDF_SAVED=${outFile}`);
console.log(`PDF_BYTES=${fs.statSync(outFile).size}`);

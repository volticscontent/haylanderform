const cnpj = process.argv[2] || '45723564000190';

const tests = [
  { name: 'CCMEI_DADOS', body: { cnpj, service: 'CCMEI_DADOS' } },
  { name: 'PGMEI', body: { cnpj, service: 'PGMEI', ano: '2025' } },
  { name: 'PGDASD', body: { cnpj, service: 'PGDASD', ano: '2025', mes: '01' } },
  { name: 'PGFN_CONSULTAR', body: { cnpj, service: 'PGFN_CONSULTAR', ano: '2025' } },
];

function extractMessage(parsed, rawText) {
  if (parsed?.error) return parsed.error;
  if (Array.isArray(parsed?.mensagens) && parsed.mensagens[0]?.texto) return parsed.mensagens[0].texto;
  if (Array.isArray(parsed?.primary?.mensagens) && parsed.primary.mensagens[0]?.texto) return parsed.primary.mensagens[0].texto;
  return String(rawText || '').slice(0, 220);
}

for (const test of tests) {
  const response = await fetch('http://127.0.0.1:3001/api/serpro', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(test.body),
  });

  const text = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {}

  const message = extractMessage(parsed, text).replace(/\s+/g, ' ').trim();
  console.log(`${test.name}|HTTP=${response.status}|MSG=${message}`);
}

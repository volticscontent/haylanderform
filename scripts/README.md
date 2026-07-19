# scripts/

Utilitários operacionais do monorepo. **Não** são parte do build nem da suíte de
testes — rode-os manualmente com `node`/`npx tsx` quando precisar.

> Scripts de debug pontuais (consultas ad-hoc a Redis/Postgres/agente) **não vivem
> aqui**. Use um arquivo local ignorado ou o histórico do git, para não poluir a
> árvore versionada com PII hardcoded.

| Script | O que faz | Uso |
|---|---|---|
| `verify-serpro-services.mjs` | Bate nos serviços Serpro (CCMEI, PGMEI, PGDASD, PGFN) via `/api/serpro` local e resume a resposta de cada um. | `node scripts/verify-serpro-services.mjs <CNPJ>` |
| `save-sitfis-pdf.mjs` | Solicita e salva em disco o PDF do SITFIS de um CNPJ via `/api/serpro` local. | `node scripts/save-sitfis-pdf.mjs <CNPJ>` |
| `replace-colors.mjs` | Codemod: normaliza tokens de cor nos `.tsx`/`.ts` de `src/app/(admin)/serpro`. | `node scripts/replace-colors.mjs` |

Requisitos: os dois primeiros precisam do backend rodando localmente
(`pnpm dev` → `http://127.0.0.1:3001`). Passe sempre o CNPJ como argumento em vez de
usar o default embutido.

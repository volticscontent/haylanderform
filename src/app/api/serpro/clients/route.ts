import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAdminSession } from '@/lib/dashboard-auth';
import { Client } from 'pg';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  if (!await verifyAdminSession(cookieStore.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) return NextResponse.json([]);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const { rows } = await client.query(`
      SELECT
        l.id,
        COALESCE(l.nome_completo, cs.cnpj) AS nome,
        cs.cnpj,
        l.telefone,
        l.email,
        (SELECT resultado FROM consultas_serpro WHERE cnpj = cs.cnpj ORDER BY created_at DESC LIMIT 1) AS resultado,
        MAX(cs.created_at) AS data_ultima_consulta,
        COALESCE(bool_or(lp.procuracao_ativa), bool_or(lp.procuracao), FALSE) AS procuracao_ativa,
        MAX(lp.procuracao_validade::text)::date AS procuracao_validade
      FROM consultas_serpro cs
      LEFT JOIN leads l ON REGEXP_REPLACE(l.cnpj, '[^0-9]', '', 'g') = cs.cnpj
      LEFT JOIN leads_processo lp ON lp.lead_id = l.id
      GROUP BY l.id, l.nome_completo, cs.cnpj, l.telefone, l.email
      ORDER BY MAX(cs.created_at) DESC
      LIMIT 30
    `);

    // Parse names from SERPRO JSON if user is not fully registered
    const formattedRows = rows.map((row) => {
      let nome = row.nome || 'CNPJ sem cadastro';
      if (!row.id && row.resultado) {
        try {
          const resData = row.resultado;
          if (resData.dados && typeof resData.dados === 'string') {
             const parsed = JSON.parse(resData.dados);
             const emp = parsed.empresario;
             nome = String(parsed.nomeEmpresarial || emp?.nomeCivil || nome);
          } else if (resData.ni) {
             nome = String(resData.nome || nome);
          }
        } catch {}
      }
      return {
        ...row,
        nome,
        resultado: undefined // do not send to frontend list
      };
    });

    return NextResponse.json(formattedRows);
  } catch (e) {
    console.error('serpro/clients error:', e);
    return NextResponse.json([]);
  } finally {
    await client.end();
  }
}

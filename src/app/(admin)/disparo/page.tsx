import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Client } from 'pg'
import Disparo from './ui/Disparo'

async function getData() {
  if (!process.env.DATABASE_URL) return []
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  try {
    await client.connect()
    const res = await client.query(`
      SELECT
        l.id, l.telefone, l.nome_completo, l.email, l.atualizado_em, l.data_cadastro,
        -- empresa
        l.razao_social, l.cnpj, l.tipo_negocio, l.faturamento_mensal,
        -- qualificação
        l.situacao, l.qualificacao, l.motivo_qualificacao, l.interesse_ajuda,
        l.possui_socio, l.pos_qualificacao,
        -- financeiro
        l.calculo_parcelamento, l.tipo_divida,
        l.valor_divida_municipal, l.valor_divida_estadual, l.valor_divida_federal,
        l.valor_divida_pgfn AS valor_divida_ativa,
        -- processo
        lp.observacoes, lp.data_controle_24h, lp.envio_disparo,
        lp.servico AS servico_negociado,
        lp.procuracao,
        -- campos removidos → NULL para não quebrar o componente
        NULL::text        AS cartao_cnpj,
        NULL::timestamptz AS data_ultima_consulta
      FROM leads l
      LEFT JOIN leads_processo lp ON l.id = lp.lead_id
      ORDER BY l.atualizado_em DESC
      LIMIT 500
    `)
    
    // Serialize dates
    const serialized = res.rows.map(row => ({
      ...row,
      data_cadastro: row.data_cadastro instanceof Date ? row.data_cadastro.toISOString() : row.data_cadastro,
      atualizado_em: row.atualizado_em instanceof Date ? row.atualizado_em.toISOString() : row.atualizado_em,
      data_controle_24h: row.data_controle_24h instanceof Date ? row.data_controle_24h.toISOString() : row.data_controle_24h
    }))

    return serialized
  } catch (err) {
    console.error('Error fetching disparo data:', err)
    return []
  } finally {
    await client.end()
  }
}

export default async function DisparoPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  
  const { verifyAdminSession } = await import('@/lib/dashboard-auth')
  const isValid = await verifyAdminSession(session?.value)

  if (!isValid) {
    redirect('/login')
  }
  const data = await getData()
  return (
    <div className="space-y-6 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Disparo Personalizado</h1>
      </div>
      <Disparo data={data} />
    </div>
  )
}
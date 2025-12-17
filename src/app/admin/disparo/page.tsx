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
        l.id,
        l.telefone, 
        l.nome_completo, 
        l.email,
        l.atualizado_em,
        l.data_cadastro,
        
        -- leads_empresarial
        le.razao_social,
        le.cnpj, 
        le.cartao_cnpj,
        le.tipo_negocio,
        le.faturamento_mensal,
        
        -- leads_atendimento
        la.observacoes,
        la.data_controle_24h,
        la.envio_disparo,
        la.data_ultima_consulta,
        
        -- leads_financeiro
        lf.calculo_parcelamento, 
        lf.valor_divida_ativa,
        lf.valor_divida_municipal,
        lf.valor_divida_estadual,
        lf.valor_divida_federal,
        lf.tipo_divida,
        
        -- leads_qualificacao
        lq.situacao,
        lq.qualificacao,
        lq.motivo_qualificacao,
        lq.interesse_ajuda,
        lq.possui_socio,
        lq.pos_qualificacao,
        
        -- leads_vendas
        lv.servico_negociado,
        lv.procuracao

      FROM leads l
      LEFT JOIN leads_empresarial le ON l.id = le.lead_id
      LEFT JOIN leads_qualificacao lq ON l.id = lq.lead_id
      LEFT JOIN leads_financeiro lf ON l.id = lf.lead_id
      LEFT JOIN leads_atendimento la ON l.id = la.lead_id
      LEFT JOIN leads_vendas lv ON l.id = lv.lead_id
      ORDER BY l.atualizado_em DESC 
      LIMIT 500
    `)
    return res.rows
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
  if (!session || session.value !== 'true') redirect('/admin/login')
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
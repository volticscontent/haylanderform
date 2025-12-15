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
        id,
        telefone, 
        nome_completo, 
        razao_social,
        cnpj, 
        email,
        observacoes,
        calculo_parcelamento, 
        atualizado_em,
        data_cadastro,
        data_controle_24h,
        envio_disparo,
        situacao,
        qualificação as qualificacao,
        motivo_qualificação as motivo_qualificacao,
        "teria_interesse?" as teria_interesse,
        valor_divida_ativa,
        valor_divida_municipal,
        valor_divida_estadual,
        valor_divida_federal,
        "cartão-cnpj" as cartao_cnpj,
        tipo_divida,
        tipo_negócio as tipo_negocio,
        faturamento_mensal,
        possui_sócio as possui_socio
      FROM haylander 
      ORDER BY atualizado_em DESC 
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
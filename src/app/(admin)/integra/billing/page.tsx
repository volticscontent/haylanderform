import { getBilling } from '../actions'
import BillingClient from './BillingClient'

export const dynamic = 'force-dynamic'

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes } = await searchParams
  const data = await getBilling(mes)
  const mesAtual = mes || new Date().toISOString().slice(0, 7)
  return <BillingClient data={data} mesAtual={mesAtual} />
}

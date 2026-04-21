import { listarCaixaPostal } from '../actions'
import CaixaPostalClient from './CaixaPostalClient'

export const dynamic = 'force-dynamic'

export default async function CaixaPostalPage() {
  const mensagens = await listarCaixaPostal()
  return <CaixaPostalClient mensagens={mensagens} />
}

import { listarGuias, IntegraGuia } from '../actions'
import GuiasClient from './GuiasClient'

export const dynamic = 'force-dynamic'

export default async function GuiasPage() {
  const guias = await listarGuias()
  return <GuiasClient guias={guias} />
}

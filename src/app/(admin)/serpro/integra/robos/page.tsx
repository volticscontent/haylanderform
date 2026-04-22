import { listarRobos } from '../actions'
import RobosClient from './RobosClient'

export const dynamic = 'force-dynamic'

export default async function RobosPage() {
  const robos = await listarRobos()
  return <RobosClient robos={robos} />
}

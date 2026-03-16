import { getMeetings } from './actions'
import { MeetingsView } from './MeetingsView'

export const metadata = {
  title: 'Agendamentos | Admin',
  description: 'Calendário de reuniões agendadas.',
}

export default async function AtendimentosPage() {
  const result = await getMeetings()
  const meetings = result.success && result.data ? result.data : []

  return (
    <MeetingsView initialMeetings={meetings} />
  )
}

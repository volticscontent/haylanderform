import { ChatInterface } from '@/components/chat/ChatInterface';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Atendimento WhatsApp | Admin',
  description: 'Interface de chat para atendimento de leads via WhatsApp.',
};

export default async function AtendimentoPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  
  const { verifyAdminSession } = await import('@/lib/dashboard-auth')
  const isValid = await verifyAdminSession(session?.value)

  if (!isValid) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ChatInterface />
      </div>
    </div>
  );
}

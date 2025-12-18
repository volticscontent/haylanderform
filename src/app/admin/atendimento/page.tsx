import { ChatInterface } from '@/components/chat/ChatInterface';

export const metadata = {
  title: 'Atendimento WhatsApp | Admin',
  description: 'Interface de chat para atendimento de leads via WhatsApp.',
};

export default function AtendimentoPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] sm:h-[calc(100vh-4rem)]">
      <div className="mb-6 flex-none">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Atendimento WhatsApp</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Gerencie conversas e interaja com leads em tempo real.</p>
      </div>
      
      <div className="flex-1 min-h-0">
        <ChatInterface />
      </div>
    </div>
  );
}

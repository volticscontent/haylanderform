import { ChatInterface } from '@/components/chat/ChatInterface';

export const metadata = {
  title: 'Atendimento WhatsApp | Admin',
  description: 'Interface de chat para atendimento de leads via WhatsApp.',
};

export default function AtendimentoPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ChatInterface />
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { sendMessageAction } from './actions';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
};

export default function TestChatPage() {
  const [phoneNumber, setPhoneNumber] = useState('5511999999999');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !phoneNumber.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const result = await sendMessageAction(userMsg, phoneNumber);

      if (result.error) {
        setMessages(prev => [...prev, { role: 'system', content: `Erro: ${result.error}` }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: result.response || '(Sem resposta)', 
          agent: result.agent 
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'system', content: 'Erro ao conectar com o servidor.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-[80vh]">
        
        {/* Header */}
        <div className="bg-blue-600 p-4 text-white">
          <h1 className="text-xl font-bold">Simulador de Chat (Teste de Bots)</h1>
          <div className="mt-2 flex items-center gap-2">
            <label className="text-sm">Telefone do Cliente:</label>
            <input 
              type="text" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="px-2 py-1 text-black rounded text-sm w-40"
              placeholder="5511..."
            />
          </div>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        >
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              Comece uma conversa para testar o bot.
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-br-none' 
                    : msg.role === 'system'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="text-xs text-blue-600 font-bold mb-1 mb-1">
                    {msg.agent}
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex items-start">
              <div className="bg-gray-200 rounded-lg p-3 rounded-bl-none animate-pulse text-gray-500 text-sm">
                Digitando...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Enviar
          </button>
        </form>
      </div>
      
      <div className="mt-4 text-gray-500 text-sm">
        * Este chat simula a lógica do webhook do WhatsApp, mas não envia mensagens reais.
      </div>
    </div>
  );
}

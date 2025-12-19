'use client';

import { useState, useRef, useEffect } from 'react';
import { sendMessageAction, getUserDataAction, updateUserDataAction } from './actions';
import { Bot, User, Settings, Save, RefreshCw, Send, Trash2 } from 'lucide-react';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
  timestamp: Date;
};

type UserData = {
  nome_completo: string;
  situacao: string;
  qualificacao: string;
  motivo_qualificacao: string;
  observacoes: string;
  email: string;
  cnpj: string;
};

const INITIAL_USER_DATA: UserData = {
  nome_completo: '',
  situacao: 'aguardando_qualificação',
  qualificacao: '',
  motivo_qualificacao: '',
  observacoes: '',
  email: '',
  cnpj: ''
};

export default function TestChatPage() {
  // State
  const [phoneNumber, setPhoneNumber] = useState('5511999999999');
  const [targetAgent, setTargetAgent] = useState('auto');
  const [userData, setUserData] = useState<UserData>(INITIAL_USER_DATA);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load User Data
  const loadUser = async () => {
    if (!phoneNumber) return;
    setLoadingUser(true);
    try {
      const result = await getUserDataAction(phoneNumber);
      const parsed = JSON.parse(result);
      if (parsed.status !== 'error' && parsed.status !== 'not_found') {
        setUserData({
          nome_completo: parsed.nome_completo || '',
          situacao: parsed.situacao || 'aguardando_qualificação',
          qualificacao: parsed.qualificacao || '',
          motivo_qualificacao: parsed.motivo_qualificacao || '',
          observacoes: parsed.observacoes || '',
          email: parsed.email || '',
          cnpj: parsed.cnpj || ''
        });
        addSystemMessage(`Dados do usuário carregados.`);
      } else {
        addSystemMessage(`Usuário não encontrado. Um novo será criado ao enviar mensagem.`);
        setUserData(INITIAL_USER_DATA);
      }
    } catch (e) {
      addSystemMessage('Erro ao carregar usuário.');
    } finally {
      setLoadingUser(false);
    }
  };

  // Save User Data
  const saveUser = async () => {
    setSavingUser(true);
    try {
      const payload = {
        telefone: phoneNumber,
        ...userData
      };
      const result = await updateUserDataAction(payload);
      const parsed = JSON.parse(result);
      if (parsed.status === 'updated' || parsed.status === 'created') {
        addSystemMessage('Dados do usuário atualizados com sucesso.');
      } else {
        addSystemMessage(`Erro ao atualizar: ${parsed.message || 'Desconhecido'}`);
      }
    } catch (e) {
      addSystemMessage('Erro ao salvar dados.');
    } finally {
      setSavingUser(false);
    }
  };

  // Send Message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !phoneNumber.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
    setLoading(true);

    try {
      const result = await sendMessageAction(userMsg, phoneNumber, targetAgent);

      if (result.error) {
        addSystemMessage(`Erro: ${result.error}`);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: result.response || '(Sem resposta)', 
          agent: result.agent,
          timestamp: new Date()
        }]);
        // Reload user data to reflect changes made by bot
        loadUser();
      }
    } catch {
      addSystemMessage('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const addSystemMessage = (text: string) => {
    setMessages(prev => [...prev, { role: 'system', content: text, timestamp: new Date() }]);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 overflow-hidden font-sans">
      
      {/* Sidebar - Settings & Tools */}
      <aside className="w-96 bg-white dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 flex flex-col shadow-xl z-10">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <h2 className="text-lg font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Settings size={20} />
            Painel de Controle
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Simulador e Debugger de Agentes</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Agent Selection */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Agente Ativo</h3>
            <div className="grid grid-cols-2 gap-2">
              {['auto', 'apolo', 'vendedor', 'atendente'].map((agent) => (
                <button
                  key={agent}
                  onClick={() => setTargetAgent(agent)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                    targetAgent === agent
                      ? 'bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500 dark:text-indigo-300 font-medium'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'
                  }`}
                >
                  {agent === 'auto' ? '🤖 Auto (Routing)' : agent.charAt(0).toUpperCase() + agent.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* User Identification */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Identificação</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="5511999999999"
                className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                onClick={loadUser}
                disabled={loadingUser}
                className="p-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                title="Carregar Usuário"
              >
                <RefreshCw size={18} className={loadingUser ? 'animate-spin' : ''} />
              </button>
            </div>
          </section>

          {/* User Data Form */}
          <section className="space-y-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Dados do Lead (DB)</h3>
              <button
                onClick={saveUser}
                disabled={savingUser}
                className="text-xs flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded transition-colors"
              >
                <Save size={12} />
                {savingUser ? 'Salvando...' : 'Salvar'}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Nome Completo</label>
                <input
                  type="text"
                  value={userData.nome_completo}
                  onChange={(e) => setUserData({...userData, nome_completo: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Situação</label>
                <select
                  value={userData.situacao}
                  onChange={(e) => setUserData({...userData, situacao: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm outline-none focus:border-indigo-500"
                >
                  <option value="aguardando_qualificação">Aguardando Qualificação</option>
                  <option value="em_atendimento">Em Atendimento</option>
                  <option value="cliente">Cliente</option>
                  <option value="desqualificado">Desqualificado</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Qualificação</label>
                <select
                  value={userData.qualificacao}
                  onChange={(e) => setUserData({...userData, qualificacao: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm outline-none focus:border-indigo-500"
                >
                  <option value="">(Nenhuma)</option>
                  <option value="MQL">MQL (Marketing)</option>
                  <option value="SQL">SQL (Sales)</option>
                  <option value="ICP">ICP (Perfil Ideal)</option>
                  <option value="desqualificado">Desqualificado</option>
                </select>
              </div>
              
               <div>
                <label className="text-xs text-zinc-500 mb-1 block">Motivo Qualificação</label>
                <input
                  type="text"
                  value={userData.motivo_qualificacao}
                  onChange={(e) => setUserData({...userData, motivo_qualificacao: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Observações</label>
                <textarea
                  rows={3}
                  value={userData.observacoes}
                  onChange={(e) => setUserData({...userData, observacoes: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>
          </section>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-zinc-100 dark:bg-zinc-950 relative">
        
        {/* Header */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${targetAgent === 'auto' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <Bot size={24} />
            </div>
            <div>
              <h1 className="font-bold text-zinc-800 dark:text-white">
                {targetAgent === 'auto' ? 'Roteamento Automático' : `Modo Teste: ${targetAgent.toUpperCase()}`}
              </h1>
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Online • {phoneNumber}
              </p>
            </div>
          </div>
          <button 
            onClick={clearChat}
            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Limpar Chat"
          >
            <Trash2 size={20} />
          </button>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 opacity-50">
              <Bot size={64} className="mb-4" />
              <p className="text-lg font-medium">Inicie uma conversa para testar</p>
              <p className="text-sm">Selecione um agente ou use o modo automático</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                  msg.role === 'user' 
                    ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300' 
                    : msg.role === 'system'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-indigo-600 text-white'
                }`}>
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.agent && (
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1 ml-1">
                      {msg.agent}
                    </span>
                  )}
                  
                  <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-zinc-800 dark:bg-zinc-700 text-white rounded-tr-none'
                      : msg.role === 'system'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                  
                  <span className="text-[10px] text-zinc-400 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="w-full pl-4 pr-12 py-3 bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-950 rounded-xl text-zinc-800 dark:text-zinc-200 outline-none transition-all shadow-inner"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          <p className="text-center text-[10px] text-zinc-400 mt-2">
            Pressione Enter para enviar. Shift+Enter para quebra de linha.
          </p>
        </div>
      </main>
    </div>
  );
}

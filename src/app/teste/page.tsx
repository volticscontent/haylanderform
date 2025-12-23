'use client';

import { useState, useRef, useEffect } from 'react';
import { sendMessageAction, getUserDataAction, updateUserDataAction } from './actions';
import { 
  Bot, 
  User, 
  Settings, 
  Save, 
  RefreshCw, 
  Send, 
  Trash2, 
  Sparkles, 
  MessageSquare,
  Cpu,
  Fingerprint,
  Database,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: string;
  timestamp: Date;
};

type UserData = {
  // Core
  nome_completo: string;
  email: string;
  telefone: string;
  
  // Qualificação
  situacao: string;
  qualificacao: string;
  motivo_qualificacao: string;
  interesse_ajuda: string;
  
  // Empresarial
  cnpj: string;
  razao_social: string;
  faturamento_mensal: string;

  // Atendimento / Vendas
  observacoes: string;
  servico_negociado: string;
  data_reuniao: string;
};

const INITIAL_USER_DATA: UserData = {
  nome_completo: '',
  email: '',
  telefone: '',
  situacao: 'aguardando_qualificação',
  qualificacao: '',
  motivo_qualificacao: '',
  interesse_ajuda: '',
  cnpj: '',
  razao_social: '',
  faturamento_mensal: '',
  observacoes: '',
  servico_negociado: '',
  data_reuniao: ''
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
  
  // Sidebar accordion states
  const [sectionsOpen, setSectionsOpen] = useState({
    agent: true,
    identity: true,
    data: true
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Adjust textarea height
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [input]);

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
          email: parsed.email || '',
          telefone: parsed.telefone || '',
          
          situacao: parsed.situacao || 'aguardando_qualificação',
          qualificacao: parsed.qualificacao || '',
          motivo_qualificacao: parsed.motivo_qualificacao || '',
          interesse_ajuda: parsed.interesse_ajuda || '',
          
          cnpj: parsed.cnpj || '',
          razao_social: parsed.razao_social || '',
          faturamento_mensal: parsed.faturamento_mensal || '',
          
          observacoes: parsed.observacoes || '',
          servico_negociado: parsed.servico_negociado || '',
          data_reuniao: parsed.data_reuniao ? new Date(parsed.data_reuniao).toISOString().split('T')[0] : ''
        });
        addSystemMessage(`Dados do usuário carregados.`);
      } else {
        addSystemMessage(`Usuário não encontrado. Um novo será criado ao enviar mensagem.`);
        setUserData(INITIAL_USER_DATA);
      }
    } catch {
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
        ...userData,
        telefone: phoneNumber.toString()
      };
      const result = await updateUserDataAction(payload);
      const parsed = JSON.parse(result);
      if (parsed.status === 'updated' || parsed.status === 'created') {
        addSystemMessage('Dados do usuário atualizados com sucesso.');
      } else {
        addSystemMessage(`Erro ao atualizar: ${parsed.message || 'Desconhecido'}`);
      }
    } catch {
      addSystemMessage('Erro ao salvar dados.');
    } finally {
      setSavingUser(false);
    }
  };

  // Send Message
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !phoneNumber.trim()) return;

    const userMsg = input.trim();
    setInput('');
    // Reset height
    if (inputRef.current) inputRef.current.style.height = 'auto';
    
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const addSystemMessage = (text: string) => {
    setMessages(prev => [...prev, { role: 'system', content: text, timestamp: new Date() }]);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 overflow-hidden font-sans">
      
      {/* Sidebar - Settings & Tools */}
      <aside className="w-[400px] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles size={24} className="animate-pulse" />
            AI Debugger
          </h2>
          <p className="text-xs text-zinc-500 mt-1 pl-8">Painel de Controle e Simulação</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          
          {/* Agent Selection */}
          <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-300">
            <button 
              onClick={() => toggleSection('agent')}
              className="w-full flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <Cpu size={16} className="text-indigo-500" />
                Agente & Roteamento
              </div>
              {sectionsOpen.agent ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {sectionsOpen.agent && (
              <div className="p-3 grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
                {['auto', 'apolo', 'vendedor', 'atendente'].map((agent) => (
                  <button
                    key={agent}
                    onClick={() => setTargetAgent(agent)}
                    className={cn(
                      "px-3 py-2.5 text-xs rounded-lg border transition-all duration-200 flex flex-col items-center justify-center gap-1",
                      targetAgent === agent
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-indigo-300 dark:hover:border-indigo-700'
                    )}
                  >
                    <span className="capitalize font-medium">
                      {agent === 'auto' ? 'Auto Routing' : agent}
                    </span>
                    <span className="text-[10px] opacity-80 font-normal">
                      {agent === 'auto' ? 'Detecta pelo status' : 'Forçar uso'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Identification */}
          <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <button 
              onClick={() => toggleSection('identity')}
              className="w-full flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <Fingerprint size={16} className="text-emerald-500" />
                Identificação do Lead
              </div>
              {sectionsOpen.identity ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {sectionsOpen.identity && (
              <div className="p-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="5511999999999"
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                    />
                    <MessageSquare size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  </div>
                  <button
                    onClick={loadUser}
                    disabled={loadingUser}
                    className="p-2 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-200 dark:border-zinc-600 transition-colors"
                    title="Carregar Usuário"
                  >
                    <RefreshCw size={18} className={loadingUser ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Data Form */}
          <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <button 
              onClick={() => toggleSection('data')}
              className="w-full flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <Database size={16} className="text-blue-500" />
                Dados (Database)
              </div>
              {sectionsOpen.data ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            {sectionsOpen.data && (
              <div className="p-3 space-y-6 animate-in slide-in-from-top-2 duration-200">
                
                {/* Grupo 1: Cadastral (Core) */}
                <div className="space-y-3 border-l-2 border-zinc-200 dark:border-zinc-700 pl-3">
                   <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                      <User size={12} /> Dados Cadastrais (Core)
                   </h3>
                   <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        placeholder="Nome Completo"
                        value={userData.nome_completo}
                        onChange={(e) => setUserData({...userData, nome_completo: e.target.value})}
                        className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs outline-none focus:border-indigo-500"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={userData.email}
                        onChange={(e) => setUserData({...userData, email: e.target.value})}
                        className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs outline-none focus:border-indigo-500"
                      />
                   </div>
                </div>

                {/* Grupo 2: Qualificação (Apolo) */}
                <div className="space-y-3 border-l-2 border-blue-200 dark:border-blue-900/50 pl-3">
                   <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Bot size={12} /> Qualificação (Apolo)
                   </h3>
                   <div className="grid grid-cols-2 gap-2">
                      <select
                        value={userData.situacao}
                        onChange={(e) => setUserData({...userData, situacao: e.target.value})}
                        className="col-span-2 w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs outline-none focus:border-indigo-500"
                      >
                        <option value="aguardando_qualificação">Aguardando</option>
                        <option value="em_atendimento">Em Atendimento</option>
                        <option value="cliente">Cliente</option>
                        <option value="desqualificado">Desqualificado</option>
                      </select>
                      
                      <select
                        value={userData.qualificacao}
                        onChange={(e) => setUserData({...userData, qualificacao: e.target.value})}
                        className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs outline-none focus:border-indigo-500"
                      >
                        <option value="">Status...</option>
                        <option value="MQL">MQL</option>
                        <option value="SQL">SQL</option>
                        <option value="ICP">ICP</option>
                        <option value="desqualificado">Desqualif.</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Interesse"
                        value={userData.interesse_ajuda}
                        onChange={(e) => setUserData({...userData, interesse_ajuda: e.target.value})}
                        className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs outline-none focus:border-indigo-500"
                      />
                   </div>
                   <input
                      type="text"
                      placeholder="Motivo Qualificação"
                      value={userData.motivo_qualificacao}
                      onChange={(e) => setUserData({...userData, motivo_qualificacao: e.target.value})}
                      className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs outline-none focus:border-indigo-500"
                    />
                </div>

                {/* Grupo 3: Empresarial */}
                <div className="space-y-3 border-l-2 border-orange-200 dark:border-orange-900/50 pl-3">
                   <h3 className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <Settings size={12} /> Dados Empresa
                   </h3>
                   <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        placeholder="CNPJ"
                        value={userData.cnpj}
                        onChange={(e) => setUserData({...userData, cnpj: e.target.value})}
                        className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs outline-none focus:border-indigo-500"
                      />
                       <input
                        type="text"
                        placeholder="Faturamento Mensal"
                        value={userData.faturamento_mensal}
                        onChange={(e) => setUserData({...userData, faturamento_mensal: e.target.value})}
                        className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs outline-none focus:border-indigo-500"
                      />
                   </div>
                </div>

                 {/* Grupo 4: Vendas/Atendimento */}
                 <div className="space-y-3 border-l-2 border-emerald-200 dark:border-emerald-900/50 pl-3">
                   <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <MessageSquare size={12} /> Vendas & Notas (Icaro)
                   </h3>
                   <textarea
                      rows={2}
                      placeholder="Observações do Agente..."
                      value={userData.observacoes}
                      onChange={(e) => setUserData({...userData, observacoes: e.target.value})}
                      className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs outline-none focus:border-indigo-500 resize-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="text"
                            placeholder="Serviço Negociado"
                            value={userData.servico_negociado}
                            onChange={(e) => setUserData({...userData, servico_negociado: e.target.value})}
                            className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs outline-none focus:border-indigo-500"
                        />
                         <input
                            type="date"
                            value={userData.data_reuniao}
                            onChange={(e) => setUserData({...userData, data_reuniao: e.target.value})}
                            className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-xs outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
                  
                  <button
                    onClick={saveUser}
                    disabled={savingUser}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-lg transition-colors font-medium text-xs shadow-sm mt-4"
                  >
                    <Save size={14} />
                    {savingUser ? 'Salvando...' : 'Salvar Tudo'}
                  </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-zinc-100/50 dark:bg-zinc-950 relative">
        
        {/* Header */}
        <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-2.5 rounded-xl shadow-sm",
              targetAgent === 'auto' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
            )}>
              <Bot size={24} />
            </div>
            <div>
              <h1 className="font-bold text-zinc-800 dark:text-white text-lg">
                {targetAgent === 'auto' ? 'Roteamento Automático' : `Modo Teste: ${targetAgent.toUpperCase()}`}
              </h1>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Online • {phoneNumber}
              </p>
            </div>
          </div>
          <button 
            onClick={clearChat}
            className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all hover:shadow-sm"
            title="Limpar Chat"
          >
            <Trash2 size={20} />
          </button>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 opacity-60">
              <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                <Bot size={40} className="text-zinc-400 dark:text-zinc-500" />
              </div>
              <p className="text-xl font-semibold text-zinc-600 dark:text-zinc-300">Pronto para iniciar</p>
              <p className="text-sm mt-2">Envie uma mensagem para testar o fluxo de agentes</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={cn(
                "flex w-full animate-in slide-in-from-bottom-2 duration-300",
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div className={cn(
                "flex max-w-[85%] gap-3",
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              )}>
                
                {/* Avatar */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                  msg.role === 'user' 
                    ? 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700' 
                    : msg.role === 'system'
                    ? 'bg-red-50 text-red-600 border-red-100'
                    : 'bg-indigo-600 text-white border-indigo-500'
                )}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>

                {/* Bubble */}
                <div className={cn(
                  "flex flex-col",
                  msg.role === 'user' ? 'items-end' : 'items-start'
                )}>
                  {msg.agent && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1 ml-1 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                      {msg.agent}
                    </span>
                  )}
                  
                  <div className={cn(
                    "px-5 py-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap leading-relaxed",
                    msg.role === 'user'
                      ? 'bg-zinc-800 dark:bg-zinc-700 text-white rounded-tr-sm'
                      : msg.role === 'system'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 rounded-tl-sm'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-tl-sm'
                  )}>
                    {msg.content}
                  </div>
                  
                  <span className="text-[10px] text-zinc-400 mt-1.5 px-1 opacity-70">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {loading && (
             <div className="flex w-full justify-start animate-in slide-in-from-bottom-2 fade-in duration-300">
               <div className="flex gap-3">
                 <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm border border-indigo-500 text-white">
                   <Bot size={18} />
                 </div>
                 <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                   <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* Input Area */}
        <div className="pt-2 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          <div className="max-w-4xl mx-auto relative">
            <div className="relative flex items-end gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-inner">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-800 dark:text-zinc-200 resize-none max-h-32 min-h-[24px] py-3 px-3 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600"
                disabled={loading}
              />
              <button
                onClick={() => handleSubmit()}
                disabled={loading || !input.trim()}
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95 mb-0.5"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={20} />}
              </button>
            </div>
            <p className="text-center text-[10px] text-zinc-400 mt-3 font-medium">
              Pressione <span className="font-bold text-zinc-500">Enter</span> para enviar • <span className="font-bold text-zinc-500">Shift + Enter</span> para nova linha
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

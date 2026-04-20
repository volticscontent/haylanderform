'use client';

import React from 'react';
import Mermaid from '@/components/Mermaid';
import { Database, Server, HardDrive } from 'lucide-react';

const postgresChart = `
erDiagram
    leads ||--o| leads_empresarial : "Dados PJ"
    leads ||--o| leads_qualificacao : "Funil de Vendas"
    leads ||--o| leads_financeiro : "Dívidas"
    leads ||--o| leads_vendas : "Negociação"
    leads ||--o| leads_atendimento : "Suporte"
    leads ||--o{ interpreter_memories : "Memória IA"
    leads ||--o{ resource_tracking : "Recursos Entregues"
    leads ||--o{ serpro_documentos : "Docs Serpro"
    disparos ||--o{ disparo_logs : "Logs"

    leads {
        int id PK
        string telefone UK
        string nome_completo
        string email
        string cpf
        boolean needs_attendant
        timestamp attendant_requested_at
        timestamp data_cadastro
    }

    leads_qualificacao {
        int id PK
        int lead_id FK
        string situacao "nao_respondido, qualificado, cliente, desqualificado"
        string qualificacao "MQL, SQL, ICP"
        string motivo_qualificacao
        boolean pos_qualificacao
    }

    leads_empresarial {
        int id PK
        int lead_id FK
        string cnpj
        string razao_social
        string faturamento_mensal
        jsonb dados_serpro
    }

    leads_financeiro {
        int id PK
        int lead_id FK
        boolean tem_divida
        string tipo_divida
        decimal valor_divida_federal
        decimal valor_divida_ativa
        string calculo_parcelamento
    }

    leads_vendas {
        int id PK
        int lead_id FK
        string servico_negociado
        timestamp data_reuniao
        boolean procuracao_ativa
        boolean cliente
    }

    leads_atendimento {
        int id PK
        int lead_id FK
        string atendente_id
        string observacoes
        timestamp data_controle_24h
        timestamp data_followup
    }

    interpreter_memories {
        int id PK
        int lead_id FK
        string phone
        string content
        string category
        vector embedding
        timestamp created_at
    }

    resource_tracking {
        int id PK
        int lead_id FK
        string resource_type
        string resource_key
        string status
        timestamp delivered_at
    }

    serpro_documentos {
        uuid id PK
        int lead_id FK
        string cnpj
        string tipo_servico
        string r2_key
        timestamp valido_ate
    }

    consultas_serpro {
        int id PK
        string cnpj
        string tipo_servico
        jsonb resultado
        string source
        timestamp created_at
    }

    disparos {
        int id PK
        string channel
        string status
        jsonb filters
        timestamp schedule_at
    }

    disparo_logs {
        int id PK
        int disparo_id FK
        string phone
        string status
    }

    colaboradores {
        int id PK
        string nome
        string email
        string cargo
        boolean ativo
    }

    services {
        int id PK
        string name
        decimal value
        string description
    }

    system_settings {
        string key PK
        string label
        string value
        string type
    }
`;

const redisChart = `
classDiagram
    class Redis_Chat_Memory {
        +String sessionKey
        +String sessionId
        +JSON context
        +List history
    }
    
    class Cache_API {
        +String key
        +JSON response
        +Int ttl
    }

    class Evolution_Instances {
        +String instanceName
        +String status
        +JSON qrCode
    }

    Redis_Chat_Memory -- Evolution_Instances : "Gerencia Sessão"
`;

export default function DatabaseDocsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <Database className="w-10 h-10 text-blue-600" />
            Arquitetura de Dados
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Visualização em tempo real da estrutura de bancos de dados do sistema.
          </p>
        </div>

        {/* PostgreSQL Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <HardDrive className="w-6 h-6 text-indigo-500" />
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
              PostgreSQL (Relacional)
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
               <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                 <h3 className="font-medium text-sm text-zinc-500 uppercase tracking-wider">Schema Diagram (ERD)</h3>
               </div>
               <Mermaid chart={postgresChart} />
            </div>
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-lg mb-4 text-zinc-900 dark:text-white">Estrutura Modular</h3>
                <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <li className="flex gap-2">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span><strong className="text-zinc-900 dark:text-zinc-200">leads (Core)</strong>: Identidade única do cliente. Chave primária de todo o sistema.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-green-500 shrink-0" />
                    <span><strong className="text-zinc-900 dark:text-zinc-200">leads_qualificacao</strong>: <code>situacao</code> canônico do funil (MQL/SQL). Fonte de verdade para o bot e crons.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-purple-500 shrink-0" />
                    <span><strong className="text-zinc-900 dark:text-zinc-200">leads_vendas</strong>: Procuração e-CAC, serviço escolhido, reunião e status de cliente.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-orange-500 shrink-0" />
                    <span><strong className="text-zinc-900 dark:text-zinc-200">resource_tracking</strong>: Rastreia vídeos e links entregues — base para o gate de Procuração.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 shrink-0" />
                    <span><strong className="text-zinc-900 dark:text-zinc-200">serpro_documentos</strong>: PDFs gerados (DAS, CND) armazenados no R2 com soft-delete.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0" />
                    <span><strong className="text-zinc-900 dark:text-zinc-200">disparos</strong>: Campanhas de WhatsApp em lote com status e logs por destinatário.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Redis Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <Server className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
              Redis (In-Memory / Cache)
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
               <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                 <h3 className="font-medium text-sm text-zinc-500 uppercase tracking-wider">Object Structure</h3>
               </div>
               <Mermaid chart={redisChart} />
            </div>
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold text-lg mb-4 text-zinc-900 dark:text-white">Casos de Uso</h3>
                <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <li className="flex gap-2">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shrink-0" />
                    <span>
                      <strong className="text-zinc-900 dark:text-zinc-200">Memória de Conversa</strong>: 
                      Armazena o contexto recente do chat para os agentes de IA (OpenAI Function Calling).
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-orange-500 shrink-0" />
                    <span>
                      <strong className="text-zinc-900 dark:text-zinc-200">Sessão Evolution API</strong>: 
                      Gerenciamento de estado das instâncias do WhatsApp.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-yellow-500 shrink-0" />
                    <span>
                      <strong className="text-zinc-900 dark:text-zinc-200">Rate Limiting</strong>: 
                      Controle de fluxo de mensagens para evitar bloqueios.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

'use client';

import React from 'react';
import Mermaid from '@/components/Mermaid';
import { Database, Server, HardDrive } from 'lucide-react';

const postgresChart = `
erDiagram
    leads ||--|| leads_empresarial : "Dados PJ"
    leads ||--|| leads_qualificacao : "Funil de Vendas"
    leads ||--|| leads_financeiro : "Dívidas e Cálculos"
    leads ||--|| leads_vendas : "Negociação"
    leads ||--|| leads_atendimento : "Suporte"

    leads {
        int id PK
        string telefone UK "Chave Pix/ID"
        string nome_completo
        string email
        string senha_gov
        string cpf
        date data_nascimento
        string nome_mae
        timestamp data_cadastro
    }

    leads_empresarial {
        int id PK
        int lead_id FK
        string cnpj
        string razao_social
        string nome_fantasia
        string faturamento_mensal
        string endereco
        string numero
        string complemento
        string bairro
        string cidade
        string estado
        string cep
        jsonb dados_serpro "Dados da API do Governo"
    }

    leads_qualificacao {
        int id PK
        int lead_id FK
        string situacao "aguardando, cliente, desqualificado"
        string qualificacao "MQL, SQL, ICP"
        string interesse_ajuda
        string motivo_qualificacao
    }

    leads_financeiro {
        int id PK
        int lead_id FK
        boolean tem_divida
        string tipo_divida "Ativa, Federal, etc"
        decimal valor_divida
        string calculo_parcelamento
    }

    leads_vendas {
        int id PK
        int lead_id FK
        string servico_negociado
        date data_reuniao
        boolean procuracao_ativa
    }

    leads_atendimento {
        int id PK
        int lead_id FK
        string observacoes
        date data_controle_24h
        string atendente_id
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
                    <span>
                      <strong className="text-zinc-900 dark:text-zinc-200">leads (Core)</strong>: 
                      Tabela central contendo a identidade única do usuário (Telefone/CPF).
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-green-500 shrink-0" />
                    <span>
                      <strong className="text-zinc-900 dark:text-zinc-200">leads_empresarial</strong>: 
                      Dados PJ, faturamento e integração Serpro.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-2 h-2 mt-1.5 rounded-full bg-purple-500 shrink-0" />
                    <span>
                      <strong className="text-zinc-900 dark:text-zinc-200">leads_qualificacao</strong>: 
                      Status do funil (MQL/SQL) e qualificação.
                    </span>
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
                      Armazena o contexto recente do chat para os agentes de IA (n8n/LangChain).
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

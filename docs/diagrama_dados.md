# Estrutura de Dados Modular (Arquitetura Satélite)

O sistema utiliza uma arquitetura de dados "Estrela" (ou Satélite), onde uma tabela central (`leads`) armazena a identidade única do usuário, e tabelas especializadas armazenam dados contextuais de cada fase da jornada.

## Diagrama de Entidade-Relacionamento (ERD)

```mermaid
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
        timestamp data_cadastro
    }

    leads_empresarial {
        int id PK
        int lead_id FK
        string cnpj
        string razao_social
        string faturamento_mensal
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
```

## Detalhamento dos Módulos

### 1. Core (`leads`)
É a identidade do cliente. O número de telefone é a chave principal de busca (E.164).
*   **Quem usa:** Todos os agentes.
*   **Objetivo:** Unicidade e contato.

### 2. Qualificação (`leads_qualificacao`)
Armazena o "termômetro" do lead.
*   **Quem usa:** Apolo (SDR).
*   **Campos Chave:**
    *   `qualificacao`: Define se o lead vale o tempo do vendedor (ICP/SQL) ou se deve ser nutrido (MQL).
    *   `situacao`: Estado atual no fluxo.

### 3. Empresarial (`leads_empresarial`)
Dados duros e técnicos, muitas vezes enriquecidos via API (Serpro).
*   **Quem usa:** Apolo (coleta inicial) e Vendedor (análise técnica).
*   **Destaque:** Armazena o JSON bruto da API do Serpro para consultas futuras.

### 4. Vendas (`leads_vendas`)
O "balcão" de negociação.
*   **Quem usa:** Vendedor (Icaro).
*   **Foco:** Agendamento de reunião e definição de escopo (serviço).

### 5. Financeiro (`leads_financeiro`)
Inteligência de dívidas.
*   **Quem usa:** Sistema de Cálculo Automático e Vendedor.
*   **Foco:** Valores exatos para gerar propostas de parcelamento.

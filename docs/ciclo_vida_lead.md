# Ciclo de Vida do Lead e Fluxo de Dados

Este documento ilustra como os dados são transformados e enriquecidos conforme o lead interage com os diferentes agentes (Apolo, Vendedor, Atendente).

## Fluxo de Agentes (State Diagram)

```mermaid
stateDiagram-v2
    [*] --> Lead_Novo : Mensagem Inicial

    state "Apolo (SDR)" as Apolo {
        Lead_Novo --> Coleta_Dados : Envia Formulário
        Coleta_Dados --> Analise_Risco : Recebe Respostas
        Analise_Risco --> Qualificado_SQL : Alta Dívida/Faturamento
        Analise_Risco --> Nutricao_MQL : Baixa Dívida/Curiosidade
        Analise_Risco --> Desqualificado : Sem perfil
    }

    state "Vendedor (Icaro)" as Vendedor {
        Qualificado_SQL --> Diagnostico : Assume atendimento
        Diagnostico --> Proposta_Valor : Identifica Dor
        Proposta_Valor --> Reuniao_Agendada : Envia Link Meeting
    }

    state "Atendente (Suporte)" as Atendente {
        Reuniao_Agendada --> Cliente_Ativo : Fechamento
        Cliente_Ativo --> Suporte_Continuo : Dúvidas/Docs
        Nutricao_MQL --> Suporte_Continuo : Tira dúvidas
    }

    Desqualificado --> [*]
```

## Fluxo de Enriquecimento de Dados (Sequence Diagram)

```mermaid
sequenceDiagram
    participant User as Usuário (WhatsApp)
    participant Apolo as 🤖 Apolo (SDR)
    participant DB as 🗄️ Banco de Dados
    participant Icaro as 🤵 Vendedor

    User->>Apolo: "Olá, quero regularizar meu MEI"
    Apolo->>DB: Cria Lead (leads)
    
    Apolo->>User: Envia Link Formulário
    User->>Apolo: Preenche Dados (CNPJ, Dívida)
    
    Apolo->>DB: Salva Dados Empresariais (leads_empresarial)
    Apolo->>DB: Salva Dados Financeiros (leads_financeiro)
    
    Note over Apolo,DB: Processo de Qualificação
    
    alt Lead Qualificado (SQL)
        Apolo->>DB: UPDATE leads_qualificacao SET qualificacao = 'SQL'
        Apolo->>User: "Tudo certo! Vou passar para o especialista."
        
        User->>Icaro: (Sistema transfere contexto)
        Icaro->>DB: Lê Dados Completos (JOIN tables)
        Icaro->>User: "Vi que sua dívida é de R$ 50k..."
        
        User->>Icaro: "Quero resolver"
        Icaro->>DB: UPDATE leads_vendas SET servico = 'Parcelamento'
        Icaro->>User: Agendar Reunião
    else Lead Desqualificado
        Apolo->>DB: UPDATE leads_qualificacao SET qualificacao = 'Desqualificado'
        Apolo->>User: "Obrigado, aqui está um guia gratuito."
    end
```

## Gatilhos de Mudança de Fase

1.  **De `Lead` para `SQL` (Sales Qualified Lead):**
    *   **Quem decide:** Apolo.
    *   **Critério:** Faturamento > X OU Dívida > Y.
    *   **Ação no Banco:** Tabela `leads_qualificacao`, coluna `qualificacao` = 'SQL'.

2.  **De `SQL` para `Reunião`:**
    *   **Quem decide:** Vendedor (Icaro).
    *   **Critério:** Cliente aceitou link da reunião.
    *   **Ação no Banco:** Tabela `leads_vendas`, coluna `data_reuniao` preenchida.

3.  **De `Reunião` para `Cliente`:**
    *   **Quem decide:** Humano (Haylander) ou Integração Pós-Venda.
    *   **Critério:** Contrato assinado.
    *   **Ação no Banco:** Tabela `leads_qualificacao`, coluna `situacao` = 'cliente'.

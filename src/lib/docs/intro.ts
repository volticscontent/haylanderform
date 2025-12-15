export const intro = {
  title: 'Documentação do Sistema',
  content: `
## Bem-vindo ao Haylander CRM

Esta é a documentação técnica oficial do **Haylander CRM**, uma plataforma desenvolvida para otimizar a gestão de leads, automações de mensagens e consultas a serviços governamentais (Serpro).

O sistema foi projetado para integrar fluxos de atendimento via WhatsApp, formulários de qualificação inteligentes e um painel administrativo robusto para gestão de dados.

---

## Arquitetura do Sistema

O projeto utiliza uma arquitetura moderna baseada em **Next.js 14** (App Router), com banco de dados **PostgreSQL** e integrações externas via APIs REST.

\`\`\`mermaid
graph TD
Client["Cliente - Lead"] -->|Acessa| Web["Frontend Next.js"]
Web -->|Requisita| API["Next.js API Routes"]

API -->|Consulta e Grava| DB[("PostgreSQL")]
API -->|Consulta CNPJ e MEI| Serpro["Serpro Gateway"]

API -->|Dispara Msg| Wpp["WhatsApp Gateway"]

Admin["Administrador"] -->|Gerencia| Web
Web -->|Server Actions| Auth["Autenticação"]
\`\`\`

## Principais Módulos

### 1. Captação e Qualificação
Focada em converter visitantes em leads qualificados através de formulários dinâmicos que calculam dívidas e identificam o perfil tributário.
- [Ver Documentação de Formulários](/admin/docs?section=forms)

### 2. Gestão de Leads (CRM)
Painel administrativo para visualização, filtragem e manipulação em massa da base de leads.
- [Ver Documentação do Painel](/admin/docs?section=admin-panel)
- [Ver API de Lista](/admin/docs?section=list-api)

### 3. Integrações Governamentais
Conexão direta com o Serpro para consulta de status MEI, DAS e PGMEI, com gestão automática de certificados digitais e tokens OAuth.
- [Ver Documentação Serpro](/admin/docs?section=serpro-api)

### 4. Automação e Disparos
Ferramentas para envio de mensagens em massa e controle de fluxo de conversas via Bot (Apolo).
- [Ver API de Disparos](/admin/docs?section=disparo-api)
- [Ver Documentação do Bot](/admin/docs?section=database-bot)

---

## Tecnologias Utilizadas

| Categoria | Tecnologias |
| :--- | :--- |
| **Frontend** | React, Tailwind CSS, Lucide Icons, Mermaid.js |
| **Backend** | Next.js API Routes, Server Actions |
| **Banco de Dados** | PostgreSQL, Vercel Postgres |
| **Autenticação** | Jose (JWT), Cookies Seguros |
| **Integrações** | Serpro (Gov.br), WhatsApp API |

## Como usar esta documentação

Utilize o menu lateral para navegar entre os módulos. Cada seção contém detalhes sobre:
- **Visão Geral**: Propósito do módulo.
- **Fluxogramas**: Diagramas visuais de funcionamento.
- **Endpoints**: Detalhes técnicos de APIs (Payloads, Respostas).
- **Banco de Dados**: Estrutura de tabelas e relacionamentos.
- **Resumo Técnico**: Pontos chave da implementação.
`
}

---
name: Visão Geral da Arquitetura
description: Síntese viva da arquitetura atual do sistema Haylanderform
type: architecture
updated: 2026-04-29
---

# Visão Geral — Haylanderform

## Propósito
Sistema completo de captação, qualificação e fechamento de clientes MEI para a Haylander Martins Contabilidade, operado via WhatsApp com automação de IA.

## Fluxo Principal

```
Lead (Ad/LP) → WhatsApp → Apolo (SDR) → Qualificação → Apolo (Closer) → Reunião → Haylander fecha
```

1. **Lead entra** via anúncio ou landing page, preenche formulário e recebe mensagem no WhatsApp
2. **Apolo (SDR)** acolhe, envia apresentação comercial, coleta CNPJ e qualifica via BANT
3. **BrasilAPI** preenche automaticamente a ficha do lead (razão social, endereço, CNAE, detecção MEI)
4. **Procuração e-CAC** é orientada — necessária para acessar Receita Federal com segurança
5. **Serpro** consulta dívidas (PGMEI + PGFN) após procuração ativa
6. **Apolo (Closer)** apresenta diagnóstico, maneja objeções, agenda reunião de fechamento
7. **Haylander** entra na reunião com contexto completo e fecha o contrato
8. **Cron pós-reunião** (4x/dia) notifica Haylander sobre reuniões pendentes de confirmação

## Componentes

### Frontend Admin (Next.js App Router)
- Painel de leads, chat ao vivo, configurações, serviços
- BFF pattern — sem lógica pesada, proxy HTTP para o bot-backend
- Rota: `src/app/(admin)/`

### Bot Backend (Node.js/Express)
- Agente Apolo: SDR + Closer em comportamentos distintos roteados por qualificação
- Agente Vendedor (Ícaro): recebe leads qualificados, foca em agendamento
- BullMQ: filas de mensagens, jobs de regularização, follow-ups
- Cron: follow-up de inatividade, relatório diário, confirmação pós-reunião, robôs Integra

### Banco de Dados (PostgreSQL)
- `leads` — ficha do lead (dados pessoais, empresa, situação)
- `leads_processo` — processo comercial (status, reunião, procuração, observações)
- `consultas_serpro` — histórico de consultas com freshness control
- `system_settings` — configurações do sistema (URLs de mídia, video_ecac, etc.)
- `services` — catálogo de serviços com preços
- `interpreter_memories` — memória vetorial do agente

### Integrações Externas
- **Serpro**: PGMEI, PGFN, SITFIS, CND, Procuração, Caixa Postal
- **BrasilAPI**: dados públicos de CNPJ, detecção de MEI
- **Evolution API**: WhatsApp (envio/recebimento de mensagens, mídia)
- **Cloudflare R2**: armazenamento de PDFs, apresentação comercial
- **Redis**: cache, filas BullMQ, roteamento de agentes, memória de sessão

## Roteamento de Agentes
O roteamento acontece via Redis (`routing_override:{phone}`):
- Sem override → **Apolo** (SDR/triagem)
- `qualificacao` definida em `update_user` → `setAgentRouting('vendedor')` → **Ícaro/Vendedor**
- Override manual pelo admin → qualquer agente

---
name: Log Operacional
description: Registro append-only de operações, decisões e mudanças significativas
type: log
---

# Log Operacional

## 2026-04-29 — Auditoria e Reforma do Agente Apolo

### Problemas identificados
- Prompt monolítico (~300 linhas) causando obediência parcial às regras
- `chamar_atendente` duplicado em `getSharedTools` e `getSuporteTools`
- `select_User` e `consultar_dados_cliente` duplicados — bot não sabia qual usar
- Descrições de tools sem triggers explícitos — escolha aleatória pelo LLM
- `l.observacoes` referenciado em query SQL mas coluna inexiste na tabela `leads`
- Fluxo de regularização com duplo disparo (tool envia mensagem + LLM também responde)
- Handoff Apolo→Ícaro sem contexto BANT estruturado
- Serviços no banco eram seeds genéricos com valor zero

### Correções aplicadas
- **Bug SQL**: removido `l.observacoes` da query em `getClientDataWithFreshness`
- **Duplicatas removidas**: `chamar_atendente` de `workflow-suporte.ts`, `select_User` de `shared-agent.ts`
- **Serviços**: seed real com 7 serviços (Basic R$150, Premium R$450, Diamond R$1.797 + avulsos)
- **PDF apresentação**: upload para R2 em `docs/apresentacao-atualizada.pdf`
- **`services.md`**: documentação completa na raiz do projeto
- **Vídeo tutorial**: URL Instagram salva em `system_settings.video_ecac`; `sendCommercialPresentation` agora detecta URLs sociais e envia como texto, não arquivo
- **`createAutonomoMessageSegments`**: inclui link Instagram + passo a passo completo com CNPJ do escritório
- **Contexto e-CAC no prompt**: CNPJ 51.564.549/0001-40, portal, vídeo, passo a passo resumido
- **Red-flags**: `situacao=red_flag` + tipos enum + `callAttendant` automático ao marcar
- **`update_user`**: descrição reescrita com TAGs obrigatórias (RESGATE_URGENTE | PARCEIRO_DE_CRESCIMENTO | NUTRICAO)
- **`consultarCnpjPublico`**: auto-popula ficha do lead via BrasilAPI (razão social, endereço, CNAE, email), detecta MEI via `natureza_juridica` código 213-5
- **`workflow-comercial.ts`**: reescrito — abertura com apresentação comercial (sem menu), procuração como requisito, tools `enviar_apresentacao_comercial` e `agendar_reuniao_fechamento`
- **`vendedor.ts`**: adicionado `agendar_reuniao_fechamento` com notificação urgente ao Haylander
- **Cron pós-reunião**: job `0 12,15,18,21 * * *` notifica Haylander sobre reuniões pendentes de confirmação

### Decisões tomadas
- Procuração e-CAC é **obrigatória** para prestar o serviço — não é opção
- Dois tipos de reunião distintos: `reuniao_pendente` (MQL) vs `reuniao_fechamento` (SQL)
- Red-flags disparam notificação imediata ao Haylander via `callAttendant`
- Auto-preenchimento da ficha via BrasilAPI é silencioso (sem precisar que o bot chame `update_user` manualmente)
- Nutrição automatizada de leads desqualificados é escopo futuro (BullMQ campaign)

# Arquitetura do Sistema de Atendimento Automatizado - Haylander

## Visão Geral

Este documento descreve a arquitetura do sistema de atendimento automatizado implementado para a Haylander Contabilidade, com foco no fluxo de regularização fiscal aprimorado e integração com n8n.

## Componentes Principais

### 1. Sistema de Agentes Inteligentes

#### 1.1 Apollo (SDR/Qualificação)
- **Função**: Primeiro contato com leads, qualificação e triagem
- **Fluxo Aprimorado**: Implementa novo sistema de regularização fiscal com mensagens segmentadas
- **Características**:
  - Mensagens segmentadas com delay (resolve problema SSR/Vercel)
  - Tracking de recursos entregues
  - Fluxo dual: autônomo vs assistido
  - Integração com sistema de procuração e-CAC

#### 1.2 Icaro (Vendas/Closer)
- **Função**: Fechamento de vendas com leads qualificados
- **Integração**: Recebe leads MQL/SQL do Apollo

#### 1.3 Atendente (Suporte)
- **Função**: Suporte pós-venda e atendimento humano
- **Integração**: Recebe transferências do Apollo quando necessário

### 2. Sistema de Tracking de Recursos

#### 2.1 Tabela `resource_tracking`
```sql
CREATE TABLE resource_tracking (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id),
    resource_type VARCHAR(50) CHECK (resource_type IN ('video-tutorial', 'link-ecac', 'formulario', 'documentacao')),
    resource_key VARCHAR(255),
    delivered_at TIMESTAMP,
    accessed_at TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('delivered', 'accessed', 'completed')),
    metadata JSONB
);
```

#### 2.2 Funções de Tracking
- `trackResourceDelivery()`: Registra entrega de recursos
- `hasResourceBeenDelivered()`: Verifica se recurso já foi entregue
- `checkProcuracaoStatus()`: Verifica status da procuração
- `markProcuracaoCompleted()`: Marca procuração como concluída

### 3. Sistema de Mensagens Segmentadas

#### 3.1 Estrutura de Mensagens
```typescript
interface MessageSegment {
    id: string;
    content: string;
    type: 'text' | 'media' | 'link';
    delay?: number;
    metadata?: Record<string, unknown>;
}
```

#### 3.2 Fluxo de Mensagens para Regularização
1. **Introdução**: Explicação sobre PGMEI e Dívida Ativa
2. **Procuração e-CAC**: Informação sobre necessidade da procuração
3. **Opções**: Autônomo vs Assistido
4. **Recursos**: Links e vídeos tutoriais
5. **Acompanhamento**: Verificação de conclusão

### 4. Integração com n8n

#### 4.1 Arquitetura Proposta
```
[WhatsApp Evolution API] 
        ↓
[Webhook Router (Next.js)] 
        ↓
[Agente Apollo] 
        ↓
[n8n Workflow] 
        ↓
[Resposta Segmentada]
```

#### 4.2 Vantagens da Integração com n8n
- **Split-out nativo**: Processamento paralelo de mensagens
- **Fallback automático**: Tratamento de erros robusto
- **Visual workflow**: Interface visual para gestão
- **Escalabilidade**: Processamento distribuído
- **Logs centralizados**: Monitoramento unificado

#### 4.3 Endpoints de Integração
- `POST /api/webhook/n8n/regularizacao`: Inicia workflow de regularização
- `POST /api/webhook/n8n/message-split`: Processa mensagens segmentadas
- `POST /api/webhook/n8n/tracking`: Atualiza tracking de recursos

### 5. Fluxo de Regularização Aprimorado

#### 5.1 Passo 1: Educação do Cliente
```
Cliente escolhe "Regularização" → Apollo envia mensagens segmentadas:
1. "Para realizar a regularização fiscal completa, precisamos consultar suas dívidas..."
2. "Para este processo, é obrigatório ter uma procuração cadastrada no e-CAC..."
3. "Você tem duas opções: fazer o processo de forma autônoma..."
```

#### 5.2 Passo 2: Escolha do Processo
- **Opção Autônoma**: 
  - Link oficial do e-CAC
  - Vídeo tutorial passo a passo
  - Tracking de acesso
  - Formulário após conclusão

- **Opção Assistida**:
  - Transferência para atendente humano
  - Acompanhamento personalizado
  - Suporte durante todo processo

#### 5.3 Passo 3: Tracking e Acompanhamento
- Registro de todos os recursos entregues
- Monitoramento de acesso e conclusão
- Notificações para próximos passos
- Métricas de engajamento

### 6. Sistema de Logs e Métricas

#### 6.1 Logs Detalhados
```typescript
// Exemplo de log estruturado
{
  timestamp: '2024-01-15T10:30:00Z',
  leadId: 12345,
  phone: '5511999999999',
  event: 'resource_delivered',
  resourceType: 'video-tutorial',
  resourceKey: 'video-tutorial-procuracao-ecac',
  status: 'delivered',
  metadata: { flowType: 'autonomo' }
}
```

#### 6.2 Métricas de Performance
- Taxa de conversão por fluxo (autônomo vs assistido)
- Tempo médio de conclusão da procuração
- Taxa de acesso aos recursos entregues
- Taxa de abandono por etapa
- Tempo de resposta dos agentes

### 7. Tratamento de Problemas SSR/Vercel

#### 7.1 Problema Identificado
- SSR limita renderização a um único evento
- Mensagens longas são truncadas ou não segmentadas
- Perda de contexto conversacional

#### 7.2 Solução Implementada
- **Mensagens Segmentadas com Delay**: Cada mensagem é enviada com delay controlado
- **Processamento Assíncrono**: Uso de Promises e setTimeout
- **Estado Persistente**: Tracking em banco de dados
- **Fallback Robusto**: Sistema de retry e tratamento de erros

### 8. Estrutura de Dados

#### 8.1 Tabela `leads`
- Informações básicas do cliente
- Status de qualificação
- Observações e histórico
- Dados de regularização

#### 8.2 Tabela `resource_tracking`
- Histórico de recursos entregues
- Status de acesso e conclusão
- Metadados adicionais
- Timestamps para análise

#### 8.3 Tabela `interpreter_memories`
- Memórias de contexto da conversa
- Categorização por tipo
- Busca vetorial para relevância

### 9. Segurança e Compliance

#### 9.1 Proteção de Dados
- Dados sensíveis armazenados com criptografia
- Acesso apenas via HTTPS
- Logs sem dados pessoais
- Conformidade LGPD

#### 9.2 Controle de Acesso
- Autenticação via JWT
- Rotas protegidas por middleware
- Rate limiting por IP/usuário
- Auditoria de acessos

### 10. Monitoramento e Observabilidade

#### 10.1 Dashboard de Métricas
- Visualização em tempo real
- Gráficos de conversão
- Alertas de anomalias
- Exportação de relatórios

#### 10.2 Integração com Ferramentas
- Sentry para error tracking
- Datadog para métricas APM
- Slack para notificações
- Grafana para dashboards

## Conclusão

Esta arquitetura resolve os principais desafios identificados:

1. **Fluxo de Regularização Aprimorado**: Sistema completo com tracking e mensagens segmentadas
2. **Problema SSR/Vercel**: Resolvido com mensagens segmentadas e delay controlado
3. **Integração n8n**: Workflow visual com split-out e fallback automático
4. **Escalabilidade**: Sistema preparado para crescimento
5. **Monitoramento**: Logs e métricas completas para análise

O sistema mantém a estrutura existente de agentes e tabelas, adicionando camadas de funcionalidade para melhor experiência do cliente e eficiência operacional.
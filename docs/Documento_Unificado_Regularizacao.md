# Regularização MEI — Regras de Negócio

> **Domínio**: Fluxo operacional do atendimento de Regularização MEI
> **Implementação**: Agentes IA (Apollo, Vendedor, Atendente) em `bot-backend/src/ai/agents/`

---

## 1. Princípios

| # | Princípio | Regra |
|---|-----------|-------|
| 1 | **Educar antes de pedir** | Nunca solicitar senha GOV ou dados sensíveis sem antes explicar o porquê |
| 2 | **Procuração primeiro** | Sempre promover a Procuração no e-CAC como caminho primário (seguro, automatizável) |
| 3 | **Senha GOV é contextual** | Só exigir quando o serviço obriga (ex: Dar Baixa + Reabrir MEI) |
| 4 | **Pré-qualificação comercial** | Apollo faz ancoragem de preço e filtra ticket antes de passar para o Vendedor |

---

## 2. Cenários de Entrada

Quando o cliente pede "Regularização", o Apollo identifica o cenário:

| Cenário | Detecção | Ação |
|---------|----------|------|
| **A — Regularização Simples** | MEI ativo com débitos pendentes | Consulta via procuração → parcelamento |
| **B — MEI Excluído** | `situacaoCadastral: BAIXADA/EXCLUIDA` no Serpro | Educação + ancoragem de preço (2 opções) |
| **C — Baixa + Reabertura** | Cliente quer encerrar CNPJ e abrir outro | Requer senha GOV obrigatória |

---

## 3. Fluxo por Agente

### Apollo (SDR / Triagem)

```
1. Cliente pede "Regularização"
2. NÃO enviar formulário ainda
3. Identificar cenário (A, B ou C)
4. Promover Procuração no e-CAC:
   - Enviar vídeo tutorial
   - Perguntar se conseguiu fazer
5. Bifurcação:
   ├─ Procuração OK → Formulário SEM campo senha GOV
   │  └─ Consulta automatizada (PGMEI/PGFN via Serpro)
   ├─ Procuração falhou → Transferir para Atendente
   └─ Cenário C (Baixa+Novo) → Formulário COM senha GOV + explicação
```

**Se MEI Excluído (Cenário B):**
```
1. Apollo detecta status no Serpro
2. Apresenta 2 opções com ancoragem:
   - Opção 1: Regularizar e esperar reabertura → ~R$250
   - Opção 2: Baixar e reabrir imediatamente → ~R$500
3. Roteamento:
   ├─ Opção 1 → Segue fluxo normal (procuração)
   └─ Opção 2 → Transfere para Vendedor (ticket alto)
```

### Atendente (Suporte / Fallback Humano)

```
Entra quando:
- Cliente não conseguiu fazer procuração (travou no vídeo/e-CAC)
- Precisa de consulta manual nos portais

Ações:
1. Contornar objeção sobre a procuração
2. Se cliente decidir fechar → Enviar formulário COM senha GOV
3. Executar consulta manual nos portais federais
```

### Vendedor (Fechamento Comercial)

```
Entra quando:
- Lead pré-qualificado de ticket alto (MEI Excluído Opção 2, dívida >50k)
- Consultoria densa que exige reunião

Ações:
1. Usar dados pré-coletados pelo Apollo
2. Agendar reunião de fechamento com Haylander
3. Conduzir ao pagamento do honorário
```

---

## 4. Regra de Formulário

| Situação | Campos do Formulário | Senha GOV |
|----------|---------------------|-----------|
| Procuração feita com sucesso | Dados básicos (nome, CPF, CNPJ) | ❌ Não pedir |
| Procuração falhou → atendimento humano | Dados básicos + Senha GOV | ✅ Pedir com explicação |
| Serviço de Baixa + Reabertura | Dados completos + Senha GOV | ✅ Obrigatória |

---

## 5. Consultas Serpro por Cenário

| Cenário | Serviços Serpro | Automação |
|---------|-----------------|-----------|
| Regularização Simples | CCMEI_DADOS, PGMEI, DIVIDA_ATIVA | ✅ IA consulta sozinha (com procuração) |
| MEI Excluído | CCMEI_DADOS (detectar status) | ✅ Detecção automática |
| Dívida Ativa + Parcelamento | PGMEI, PARCELAMENTO_MEI_CONSULTAR | ✅ IA consulta sozinha |
| Baixa + Reabertura | Processo manual no portal | ❌ Requer humano |

---

## 6. Métricas de Sucesso

| Métrica | Meta |
|---------|------|
| % de clientes que fazem procuração | > 60% |
| Tempo de qualificação (Apollo) | < 5 minutos |
| Taxa de conversão MEI Excluído | > 30% |
| Redução de solicitações de senha GOV | > 70% vs. fluxo anterior |

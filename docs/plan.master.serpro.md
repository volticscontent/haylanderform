# plan.master.serpro.md — Auditoria e Integração Serpro

> **Status**: Aguardando aprovação

---

## 🎯 Objetivo Direto
Garantir a precisão absoluta da comunicação com a API Serpro (Integra Contador), replicando a engenharia de software do ERP Calima, integrando ao Bot com mais segurança (Task 2) e pavimentar o empacotamento da integração em Dart.

---

## 🔍 1. Auditoria e Benchmarking (A API que Funciona)
Nossa requisição atual sofre com erros 400. A meta é analisar e espelhar como o módulo Integra Contador do ERP Calima faz as chamadas.
- Ler o funcionamento exato dos payloads (versão 2.4, formatação de parâmetros como `anoCalendario` etc).
- Compreender a orquestração de dependências (que passos eles dão para chegar no PGFN/PGMEI).
- Refatorar nosso `bot-backend/src/lib/serpro.ts` para emular a chamada original validada.

---

## 🛡️ 2. Segurança no Fluxo de Atendimento (Task 2)
Integrar a lógica Serpro respeitando a privacidade e a fluidez do usuário.
- O Bot só fará a requisição aos servidores (Serpro) após o aceite formal da **Procuração e-CAC**.
- Nenhuma varredura profunda e custosa deve ser acionada na "boca do funil". Reduzimos o abuso de infraestrutura.

---

## 📦 3. Empacotamento Dart (Portabilidade Mobile)
Reutilizar a expertise já existente na linguagem alvo.
- **Validar Base:** Avaliar o repositório `MarlonSantosDev/serpro_integra_contador_api` para entender como ele resolveu os desafios de mTLS (certificados pfx) em Dart.
- **Módulo Próprio:** Iniciar `/dart-packages/serpro_integra_contador/` no nosso monorepo visando os CRMs Mobile futuros.
- **DTOs Universais:** Garantir que o Node.js e o pacote Dart usem a exata mesma forma nos *bodies* JSON.

---

## 📋 4. Tarefas de Execução
- [x] Ajustar payload Serpro (v2.4) e parâmetros fiscais no backend (Benchmarking Calima).
- [x] Acoplar limitação da consulta Serpro no Bot para rodar apenas *pós* Procuração.
- [x] Inspecionar pacote Dart baseline (`MarlonSantosDev`).
- [x] Inicializar `/dart-packages/serpro_integra_contador/`.

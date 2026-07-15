# Auditoria de Acompanhamento Serpro Integra Contador — 2026-04-24

## Escopo
Esta auditoria é um follow-up do relatório `serpro-audit-2026-04-19.md` e dos ADRs recentes (`ADR-0001` e `ADR-0003`). O objetivo é verificar quais pendências e bugs foram resolvidos e qual o estado atual da integração com a API do Serpro no Módulo 4 (Integra Contador).

---

## 1. Revisão das Pendências Anteriores (de 2026-04-19)

### 1.1. SIT_FISCAL_RELATORIO (Fluxo de 2 etapas)
- **Status Anterior:** Pendente.
- **Status Atual:** ✅ **Resolvido**.
- **Detalhes:** O fluxo foi abstraído e implementado com sucesso em `src/lib/sitfis-flow.ts` (`fetchSitfisRelatorio`). A função agora faz a chamada para `SIT_FISCAL_SOLICITAR`, extrai o `protocoloRelatorio` e o `tempoEspera`, aguarda o tempo necessário (fallback para 4s) e faz a segunda chamada automaticamente. A UI no `serpro/page.tsx` consome esse fluxo e exibe o PDF final sem exigir ação manual do usuário.

### 1.2. CAIXA_POSTAL
- **Status Anterior:** Falhava por falta de procuração código `00006` no e-CAC.
- **Status Atual:** ⚠️ **Requer Ação do Cliente/Negócio**.
- **Detalhes:** A nível de código, o payload foi corrigido (o `bot-backend` agora limpa adequadamente os parâmetros raiz e envia apenas `cnpjReferencia` na chave `dados`, mitigando o erro HTTP 400 documentado hoje). No entanto, o contador ainda precisa solicitar a procuração `00006` aos clientes via e-CAC para que a rota funcione em produção.

### 1.3. DASN_SIMEI
- **Status Anterior:** Serviço não contratado na Loja Serpro.
- **Status Atual:** ⚠️ **Requer Ação Administrativa**.
- **Detalhes:** Continua bloqueado aguardando contratação comercial do pacote na Loja Serpro (`loja.serpro.gov.br`).

### 1.4. PGMEI_ATU_BENEFICIO
- **Status Anterior:** Faltava mapear a estrutura de `infoBeneficio[]`.
- **Status Atual:** ⚠️ **Pendente de Implementação**.
- **Detalhes:** A interface de payload em `bot-backend/src/lib/serpro.ts` ainda não mapeia ativamente o array complexo `infoBeneficio`. Requer leitura técnica profunda do manual oficial do Serpro para modelar os campos.

### 1.5. PAGAMENTO (COMPARRECADACAO72)
- **Status Anterior:** Faltavam parâmetros obrigatórios não mapeados.
- **Status Atual:** ⚠️ **Pendente de Implementação**.
- **Detalhes:** Assim como o `PGMEI_ATU_BENEFICIO`, requer o preenchimento de campos específicos do documento no objeto `dados` para ser consumido com sucesso.

---

## 2. Validação dos Bugs do ADR-0003 (2026-04-23)
O `ADR-0003-serpro-sitfis-pgmei-bugs.md` apontava falhas silenciosas:

- **Bug 1: `anoCalendario` ausente no PGMEI_EXTRATO/BOLETO.**
  ✅ **Resolvido:** O código no `bot-backend` foi atualizado para injetar `anoCalendario` ou `anoPA` (no caso do DCTFWEB) no objeto `dados`.
- **Bug 2: SITFIS enviava CNPJ sem CPF.**
  ✅ **Resolvido:** Adicionado um `throw new Error` caso `options.cpf` não seja passado.
- **Bug 3: DIVIDA_ATIVA não documentada.**
  ✅ **Resolvido:** Adicionados os comentários explicativos no arquivo de configuração (`serpro-config.ts`).
- **Bug 4: Mensagem de CND obscura.**
  ✅ **Resolvido:** O erro disparado agora instrui claramente a necessidade do fluxo de 2 etapas.

---

## 3. Melhorias Recentes de Resiliência (2026-04-24)
Durante o sprint atual, as seguintes melhorias foram adicionadas à fundação da Serpro:

1. **Auto-Refresh de Token (401 Unauthorized):**
   O `bot-backend/src/lib/serpro.ts` foi refatorado para interceptar erros 401 e forçar o `forceRefresh` da autenticação mTLS (OAuth client_credentials), refazendo a request automaticamente.
2. **Extração Dinâmica de PDF:**
   O utilitário `extractPdfBase64` agora consegue varrer objetos complexos e strings em JSON nativo para encontrar a chave `pdf` independentemente de onde o Serpro a aninhar na resposta.
3. **Limpeza de Payload (`CAIXA_POSTAL` e afins):**
   Garantido que chaves genéricas (`cnpj`, `ano`) sejam removidas do nó `dados` quando o serviço utilizar campos específicos (como `cnpjReferencia`), evitando a rejeição 400 do Serpro.

---

## 4. Conclusão da Auditoria
A fundação técnica da API Serpro está **sólida e resiliente**. Os erros sistêmicos (HTTP 400 por payload mal formatado, HTTP 401 por expiração de token e fluxo manual de 2 etapas do SITFIS) foram todos contornados pelo código do `bot-backend` e do `frontend`.

**Próximos Passos Prioritários:**
1. Ação Comercial: Contratar o serviço DASN_SIMEI.
2. Ação Operacional: Orientar a base de leads a conceder procuração `00006` para a CAIXA_POSTAL.
3. Ação Técnica (Baixa Prioridade): Implementar schemas detalhados para `PGMEI_ATU_BENEFICIO` e `PAGAMENTO` caso esses serviços se tornem vitais para o produto.
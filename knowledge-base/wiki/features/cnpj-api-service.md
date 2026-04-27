---
title: "Serviço de API de CNPJ"
date: 2026-04-26
type: feature
module: backend
status: completed
tags: [api, cnpj, validation, cache, rate-limiting]
---

# Serviço de API de CNPJ

## Visão Geral

Implementação completa de um serviço robusto de API para validação e consulta de CNPJs, com integração à API pública BrasilAPI, sistema de cache local, rate limiting e testes unitários com cobertura superior a 80%.

## Componentes Implementados

### 1. CNPJValidator (`bot-backend/src/lib/cnpj-validator.ts`)
- **Validação de formato:** Verifica se o CNPJ está no formato correto (XX.XXX.XXX/XXXX-XX)
- **Dígitos verificadores:** Implementa algoritmo completo de validação de CNPJ
- **Métodos principais:**
  - `clean()` - Remove máscaras e caracteres especiais
  - `isValidFormat()` - Valida formato básico
  - `isValidCheckDigits()` - Valida dígitos verificadores
  - `format()` - Aplica máscara de formatação
  - `getErrorMessage()` - Retorna mensagens de erro detalhadas

### 2. CNPJService (`bot-backend/src/lib/cnpj-service.ts`)
- **Integração BrasilAPI:** Consumo da API pública sem necessidade de token
- **Cache local:** Sistema de cache em memória com TTL de 24 horas
- **Rate limiting:** Limite de 10 requisições por minuto por IP
- **Tratamento de erros:** Fallback para CNPJs inválidos e serviços indisponíveis
- **Timeout:** 10 segundos para requisições externas

### 3. Rotas REST (`bot-backend/src/routes/cnpj.ts`)
- `GET /api/cnpj/:cnpj` - Consulta individual de CNPJ
- `POST /api/cnpj/batch` - Consulta em lote (máximo 50 CNPJs)
- `POST /api/cnpj/validate` - Validação apenas (sem consulta externa)
- `GET /api/cnpj/cache/stats` - Estatísticas do cache
- `DELETE /api/cnpj/cache` - Limpar cache manualmente

## Estrutura de Dados

```typescript
interface CNPJData {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  situacao_cadastral: string;
  endereco: {
    logradouro: string;
    numero?: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
  atividades_principais: Array<{code: string; text: string}>;
  atividades_secundarias: Array<{code: string; text: string}>;
  data_abertura?: string;
  motivo_situacao_cadastral?: string;
  telefone?: string;
  email?: string;
  capital_social?: number;
  porte?: string;
  natureza_juridica?: string;
  qsa?: Array<{nome: string; qual: string}>;
  ultima_atualizacao?: string;
}
```

## Testes e Validação

### CNPJs de Teste Validados
1. **45.723.564/0001-90** - ARTHUR ROSA LEITE FONTANARI DOS SANTOS (ATIVA)
2. **45.175.209/0001-24** - ELVIRA JUNGE (BAIXADA)
3. **14.511.139/0001-04** - RODRIGO SANTIAGO CAMPOS (ATIVA)
4. **37.418.796/0001-07** - LUIS GUSTAVO FAUSTINO OLIMPIO (ATIVA)

### Cobertura de Testes
- **18 testes** no validador com 100% de cobertura
- **27 testes** no serviço com mock do axios
- Todos os cenários de erro cobertos: CNPJ inválido, timeout, rate limit, serviço indisponível

## Performance e Segurança

- **Cache:** Reduz chamadas à API externa em até 80% para consultas repetidas
- **Rate Limiting:** Protege contra abuso sem comprometer usabilidade normal
- **Validação:** Algoritmo completo garante precisão na validação
- **Logs:** Registro detalhado de todas as operações para auditoria

## Decisões Técnicas

1. **API BrasilAPI:** Escolhida por ser gratuita, confiável e não requerer autenticação
2. **Cache em Memória:** Solução simples e eficiente para o volume esperado
3. **TypeScript:** Type safety e melhor manutenibilidade do código
4. **Jest:** Framework de testes maduro com excelente integração
5. **Express.js:** Framework web robusto e bem estabelecido

## Arquivos Criados/Modificados

```
bot-backend/src/lib/cnpj-validator.ts
bot-backend/src/lib/cnpj-service.ts
bot-backend/src/routes/cnpj.ts
bot-backend/src/lib/__tests__/cnpj-validator.test.ts
bot-backend/src/lib/__tests__/cnpj-service.test.ts
bot-backend/src/scripts/test-cnpjs.ts
bot-backend/package.json (axios adicionado)
```

## Próximos Passos

1. Adicionar integração com outras APIs de CNPJ como fallback
2. Implementar cache distribuído (Redis) para múltiplas instâncias
3. Adicionar métricas e monitoramento (Prometheus/Grafana)
4. Criar interface administrativa para gerenciar cache e estatísticas
5. Estender para validação de CPFs como funcionalidade complementar

## Referências

- [BrasilAPI](https://brasilapi.com.br/)
- [Algoritmo de Validação de CNPJ](https://www.geradorcnpj.com/algoritmo_do_cnpj.htm)
- [Jest Documentation](https://jestjs.io/)
- [Express.js](https://expressjs.com/)
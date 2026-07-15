---
title: Segurança — Certificados Serpro e OAuth
type: security
tags: [serpro, certificado, mtls, oauth, pfx]
updated: 2026-04-20
status: current
---

# Certificados Serpro e Segurança

## Certificado Digital (.pfx)

O Serpro exige mTLS com certificado digital A1 (ou A3) do escritório contábil.

**Armazenamento:**
- Prod: `SERPRO_PFX_BASE64` (base64 do arquivo .pfx) em variável de ambiente segura
- Passphrase: `SERPRO_PFX_PASSPHRASE`
- Em memória: extraído para `cert.pem` + `key.pem` no boot (nunca escrito em disco)

**Regra crítica:** Nunca deletar o .pfx sem confirmar que os Secrets estão operacionais e mapeados. Uma rotação errada derruba todas as consultas Serpro.

## Fluxo OAuth 2.0

```
PFX → cert + key (in-memory)
    ↓
POST https://gateway.apiserpro.serpro.gov.br/token
     client_credentials + mTLS
    ↓
Bearer token (cache, renovado antes de expirar)
    ↓
GET /api-serpro/{servico}/{cnpj}
    Authorization: Bearer {token}
    (TLS com cert cliente)
```

## Rotação de Certificado

Certificados A1 vencem anualmente. O painel Admin `/integra/dashboard` alerta 30 dias antes.
Tabela `integra_empresas.certificado_validade` rastreia a data de cada empresa.

Ao renovar:
1. Obter novo .pfx da Receita Federal
2. Converter para base64: `base64 -i novo.pfx`
3. Atualizar `SERPRO_PFX_BASE64` e `SERPRO_PFX_PASSPHRASE` nos Secrets
4. Reiniciar o bot-backend
5. Testar uma consulta PGMEI manualmente

## API Secret (Bot Backend)

Rotas sensíveis validam `x-api-key` == `process.env.API_SECRET`.
Frontend envia via `BOT_BACKEND_SECRET` nas Server Actions.

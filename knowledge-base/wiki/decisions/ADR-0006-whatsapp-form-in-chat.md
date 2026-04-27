---
title: "ADR-0006: Coleta de Dados In-Chat vs Formulário Externo (Opção B)"
type: decision
tags: [comercial, ux, whatsapp, regularizacao, formulario]
date: 2026-04-26
status: accepted
---

# ADR-0006: Coleta de Dados In-Chat vs Formulário Externo (Opção B)

## Contexto

A Opção B do fluxo de regularização (para quem recusa fazer a procuração no e-CAC) enviava o cliente para um "formulário seguro" externo, pedindo CPF + Senha GOV. Isso violava a jornada "sem formulários externos" definida no requisito e gerava atrito.

## Decisão

**Substituir Opção B por coleta conversacional dentro do WhatsApp.**

O bot usa a tool `iniciar_coleta_situacao_whatsapp` para:
1. Enviar mensagem de boas-vindas (`createSituacaoFormSegments()`)
2. Coletar via perguntas naturais: CNPJ → Razão Social → CPF empresário → faturamento → tem_divida
3. Salvar cada dado com `update_user` conforme o cliente responde
4. Ao ter CNPJ + faturamento + tem_divida, disparar `enviar_link_reuniao` proativamente

**Nenhum link externo, nenhum formulário, nenhuma senha GOV.**

## Por que não pedir a senha GOV?

- Risco de phishing percebido pelo cliente → confiança destruída
- Regulatório: não há base legal para armazenar credenciais de acesso
- Tecnicamente desnecessário: a Opção A (procuração) permite consultar o Serpro sem a senha

## Trade-offs

**Positivo:**
- Jornada 100% dentro do WhatsApp (sem redirecionamento)
- Nenhum dado sensível (senha) capturado pelo bot
- Coleta conversacional → menos abandono que formulário externo

**Negativo:**
- Sem procuração → bot não pode consultar o Serpro diretamente
- Cliente nesta trilha vai para reunião (humano faz a consulta depois), não recebe diagnóstico imediato
- Dados coletados dependem de o cliente saber suas informações (faturamento, dívidas)

## Consequência na Jornada

Opção B não é uma alternativa equivalente à Opção A — é um caminho de qualificação para reunião consultiva, não diagnóstico automatizado. Isso está correto porque sem procuração não há como operar o Serpro legalmente.

## URL de Vídeo Removida

`createAutonomoMessageSegments()` tinha `https://haylander.com.br/videos/procuracao-ecac-tutorial.mp4` (URL fictícia). Removida e substituída por instruções textuais: "Outros > Outorgar Procuração".

**Quando gravar o vídeo real**, adicionar de volta como segmento `type: 'media'` com `mediaType: 'video'`.

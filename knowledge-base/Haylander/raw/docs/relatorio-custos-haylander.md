# Relatório Estratégico: Arquitetura de Custos e APIs do Bot
**Para: Haylander Martins**  
**Assunto: Como o sistema economiza seu dinheiro e como a bilhetagem funciona**

---

## 1. A Estratégia de Redução de Custos (O "Pulo do Gato")

Haylander, quando construímos o Apolo e o painel Admin, o maior risco financeiro para a sua operação era a **bilhetagem do Serpro**. O Serpro cobra por consulta. Se todo lead "curioso" que mandasse um CNPJ no WhatsApp gerasse uma consulta no Serpro, sua fatura no fim do mês seria gigantesca, sem garantia de fechamento.

Para resolver isso, dividimos o cérebro do bot em duas camadas:

### 🟢 Camada 0: Brasil API (Custo ZERO)
- **Como funciona:** Quando o lead manda o CNPJ, o bot vai na Brasil API. 
- **O que ele traz:** Nome da empresa, Endereço, CNAE e, o mais importante, descobre se é MEI ou não.
- **Custo:** **R$ 0,00**. É uma API pública e gratuita.
- **Estratégia:** O bot preenche a ficha do cliente no seu banco de dados e qualifica o lead de forma invisível, sem gastar 1 centavo do seu bolso e sem pedir procuração.

### 🔴 Camadas 1 e 2: Integra Contador / Serpro (Custo PAGO)
- **Como funciona:** O bot só aciona o Serpro quando o lead avança na conversa, demonstra que tem um problema real e **assina a procuração no e-CAC**.
- **O que ele traz:** Dados fiscais reais, Dívida Ativa, guias vencidas (DAS), certidões (CND) e Caixa Postal.
- **Estratégia:** Você só paga a consulta do Serpro para leads que já te deram a procuração, ou seja, leads que estão a um passo de fechar negócio ou clientes que já estão na base pagando mensalidade.

---

## 2. Como funcionam os Custos do Integra Contador (Serpro)

O Integra Contador não cobra uma mensalidade fixa de software, ele cobra pelo **consumo** (bilhetagem). A lógica funciona por "pacotes de requisições" ou custo unitário:

1. **Consultas (Ex: ver se tem dívida):** Geralmente custam centavos por requisição (ex: R$ 0,05 a R$ 0,15 dependendo do volume mensal contratado).
2. **Emissões (Ex: gerar o PDF de um DAS vencido):** Tem um valor unitário ligeiramente diferente das consultas.
3. **Declarações (Ex: transmitir PGDAS/DCTFWeb):** É o serviço com maior valor agregado (ex: R$ 0,40 a R$ 0,80 por envio).

*Valores variam conforme a tabela oficial do Serpro vigente no seu contrato.*

**O que isso significa na prática:**
Se um cliente te paga R$ 150,00 por mês no plano BASIC, o custo de robô (Serpro) para olhar o CNPJ dele todo mês e baixar a guia DAS vai ser na casa de **R$ 1,00 a R$ 2,00 por cliente/mês**. A margem de lucro operacional é gigantesca, pois o bot faz o trabalho braçal.

---

## 3. O Que Você (Haylander) Precisa Conferir no Contrato

Como você já fez a adesão ao **Integra Contador**, você já tem as chaves principais. No entanto, o Serpro permite habilitar ou desabilitar "módulos" dentro desse contrato para controlar o que a API pode ou não fazer.

Acesse o [Portal do Cliente Serpro](https://cliente.serpro.gov.br/) e confirme se os seguintes submódulos estão ativos no seu plano do Integra Contador:

✅ **PGMEI e PGDASD:** (Para buscar dívidas e gerar as guias do MEI e Simples). *-> O bot já está usando isso muito bem.*  
✅ **SITFIS e CND:** (Situação Fiscal). *-> Essencial para o bot conseguir emitir Certidão Negativa.*  
✅ **CAIXA POSTAL:** *-> Essencial para o bot ler notificações de malha fina e avisar o cliente.*  
✅ **PGFN:** (Procuradoria Geral da Fazenda Nacional). *-> Necessário apenas se você for automatizar parcelamentos de dívidas antigas que já saíram da Receita.*

> **Nota:** Não contrate serviços avulsos de "Consulta CNPJ" ou "Consulta CPF" no Serpro. O pacote do Integra Contador já é suficiente para a operação contábil e a Brasil API (gratuita) já cobre a parte de cadastro.

---

## 4. O Fluxo Comercial na Prática

Para garantir a segurança financeira do seu escritório, o Apolo foi treinado com a seguinte regra inquebrável:

1. **Lead entra:** Apolo puxa dados na Brasil API (R$ 0,00).
2. **Qualificação:** Apolo entende a dor e manda o vídeo do Instagram ensinando a fazer a procuração no e-CAC.
3. **Ponto de Checagem:** O bot entra em pausa até o sistema confirmar que a procuração caiu.
4. **Execução:** Procuração confirmada? Aí sim o bot aciona o Serpro (Custo de centavos), faz o raio-X completo das dívidas e gera o orçamento para você fechar a venda.

Com esse modelo, você automatiza o escritório inteiro com custo de servidor baixíssimo e bilhetagem inteligente.
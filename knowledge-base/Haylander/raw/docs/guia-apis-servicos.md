# Guia Prático: APIs do Haylanderform (Brasil API x Serpro)

## Como funciona nossa arquitetura atual

No Haylanderform, nós utilizamos **duas fontes de dados** para atender o cliente de forma inteligente e econômica. Elas têm propósitos totalmente diferentes:

### 1. Brasil API (Gratuita e Sem Autenticação)
- **O que faz:** Busca **dados públicos** básicos da empresa assim que o cliente informa o CNPJ no WhatsApp.
- **Para que serve:** Puxa a Razão Social, CNAE, Endereço, Situação Cadastral (Ativa/Baixada) e descobre automaticamente se o cliente é MEI (Natureza Jurídica 213-5).
- **Vantagem:** O bot preenche a ficha do lead de forma invisível, sem gastar 1 centavo e sem precisar que o cliente faça procuração no e-CAC. É a nossa "Camada 0".

### 2. Integra Contador - Serpro (Paga e Autenticada via e-CAC)
- **O que faz:** Busca **dados fiscais sigilosos** da empresa.
- **Para que serve:** Ver se o cliente tem dívida ativa, gerar guias de pagamento (DAS), puxar recibos, emitir Certidão Negativa (CND) e ler mensagens da Caixa Postal da Receita.
- **Vantagem:** O bot consegue atuar como um contador real, diagnosticando e regularizando a empresa (Camada 1 e Camada 2).
- **Exigência Absoluta:** O bot só consegue acessar esses dados se o cliente fizer a **Procuração Eletrônica no e-CAC** passando os poderes para o CNPJ do seu escritório (Haylander Martins Ltda).

---

## O que ainda falta assinar/contratar no Serpro?

Como você já possui a plataforma **Integra Contador** contratada e configurada, a maior parte do trabalho duro já está resolvida. O Integra Contador é um "guarda-chuva" gigantesco que abriga mais de 80 serviços da Receita Federal.

Você **NÃO** precisa contratar serviços soltos como "Consulta CNPJ" ou "Consulta CPF" no Serpro, porque:
1. O CNPJ nós já consultamos de graça na Brasil API.
2. O CPF o bot pergunta diretamente ao cliente (ou o próprio Integra Contador devolve dentro do relatório fiscal).

Entretanto, dependendo do pacote específico do Integra Contador que você aderiu, verifique na **Loja Serpro** ou no seu **API Center (estaleiro.serpro.gov.br)** se os seguintes serviços (submódulos) estão habilitados no seu contrato:

### 1. Dívida Ativa da União (PGFN)
- **Status Atual:** Hoje, o bot usa a rota do `PGMEI` (versão 2.4) para tentar extrair dados de dívida ativa. Funciona na maioria dos casos de MEI.
- **O que falta assinar:** Caso você queira que o bot faça parcelamentos diretos de dívidas grandes (PAEX/SIPADE) ou busque dívidas de empresas do Simples Nacional que já saíram da Receita e foram para a Procuradoria (PGFN), você precisará garantir que o endpoint dedicado da **PGFN** esteja ativo no seu pacote.

### 2. Caixa Postal (DTE)
- **Status Atual:** O código do bot já tem a funcionalidade de ler as mensagens da Caixa Postal da Receita Federal prontas.
- **O que falta assinar:** A Caixa Postal às vezes tem cobrança separada no Integra Contador. Se você quiser que o bot avise o cliente quando ele receber uma notificação de malha fina, garanta que o serviço `CAIXAPOSTAL` esteja liberado no seu plano.

### 3. Emissão de Certidão Negativa (CND)
- **Status Atual:** O código do bot está pronto para gerar CNDs automaticamente.
- **O que falta assinar:** A emissão de CND exige o pacote de `SITFIS` (Situação Fiscal). Confirme se o seu contrato do Integra Contador engloba o `RELATORIOSITFIS92`.

---

## Resumo: O que você precisa fazer hoje?

1. **Nada de novo no código:** O bot já sabe usar a Brasil API para economizar dinheiro e o Integra Contador para investigar dívidas.
2. **Revisar seu pacote:** Entre no [Cliente Serpro](https://cliente.serpro.gov.br/) e confira se o seu plano do Integra Contador permite gerar **CND**, acessar a **Caixa Postal** e consultar a **PGFN**. Se sim, não há mais nada a contratar.
3. **Continuar com a Procuração:** O sucesso de todo o sistema depende de o cliente fazer a procuração no e-CAC para o seu CNPJ. Sem isso, a inteligência do Serpro não liga.
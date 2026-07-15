# Tutorial — Como localizar Consumer Key e Consumer Secret da API PGFN no Serpro

**Objetivo:** orientar o Haylander a entrar no portal da Serpro, localizar a aplicação da API **Consulta Dívida Ativa da União / PGFN** e copiar corretamente as credenciais permanentes: **Consumer Key** e **Consumer Secret**.

**Importante:** este tutorial é para encontrar as credenciais permanentes da aplicação. O token que começa com `eyJ...` não deve ser colocado como `Consumer Secret`, porque ele é apenas um token temporário de acesso.

---

## 1. O que precisamos encontrar

Para configurar a integração PGFN no sistema, precisamos de dois campos:

| Campo no Serpro | Campo no sistema |
|---|---|
| Consumer Key | `PGFN_CLIENT_ID` |
| Consumer Secret | `PGFN_CLIENT_SECRET` |

No arquivo `.env` do backend, a configuração final ficará assim:

```env
PGFN_TOKEN_URL=https://gateway.apiserpro.serpro.gov.br/token
PGFN_BASE_URL=https://gateway.apiserpro.serpro.gov.br/consulta-divida-ativa-df/api
PGFN_CLIENT_ID=cole_aqui_o_consumer_key
PGFN_CLIENT_SECRET=cole_aqui_o_consumer_secret
```

---

## 2. Diferença entre Consumer Key, Consumer Secret e Token

### Consumer Key

É o identificador permanente da aplicação contratada na Serpro.

Geralmente parece uma chave curta, por exemplo:

```txt
fddUi1Ks7TjsQQ0skrT7jsA9Onoa
```

### Consumer Secret

É a senha permanente da aplicação. Ela fica junto da Consumer Key na tela de credenciais da aplicação.

Ela deve ser copiada exatamente como aparece no portal.

### Token Bearer

É o token temporário gerado depois que a aplicação autentica.

Geralmente começa com:

```txt
eyJ...
```

E tem três blocos separados por ponto:

```txt
xxxxx.yyyyy.zzzzz
```

Esse token expira em aproximadamente 1 hora. Ele **não deve** ser usado como `PGFN_CLIENT_SECRET`.

---

## 3. Acessar o portal correto

### Passo 1 — Abrir o Portal do Cliente Serpro

Acesse:

https://cliente.serpro.gov.br/

Depois faça login com a conta vinculada ao contrato da Serpro.

**[INSERIR PRINT 1 AQUI — Tela inicial do Portal do Cliente Serpro]**

---

## 4. Encontrar o contrato ou produto da PGFN

### Passo 2 — Procurar os produtos contratados

Dentro do Portal do Cliente, procure uma área com nome parecido com:

- **Meus Produtos**
- **Meus Contratos**
- **Produtos Contratados**
- **APIs Contratadas**
- **Minhas Aplicações**

O nome exato pode variar conforme a tela da Serpro.

**[INSERIR PRINT 2 AQUI — Menu onde aparecem produtos/contratos/aplicações]**

### Passo 3 — Abrir o produto da Dívida Ativa

Procure pelo produto:

- **Consulta Dívida Ativa da União**
- **Consulta Dívida Ativa**
- **Dívida Ativa / PGFN**

Ao encontrar, clique para abrir os detalhes do produto ou da aplicação vinculada.

**[INSERIR PRINT 3 AQUI — Produto Consulta Dívida Ativa / PGFN listado]**

---

## 5. Localizar a aplicação e as credenciais

### Passo 4 — Entrar na aplicação

Na tela do produto, procure a aplicação criada para consumo da API.

A Serpro pode mostrar isso com nomes como:

- **Aplicações**
- **Minhas Aplicações**
- **Credenciais**
- **Gerenciar aplicação**
- **Chaves de acesso**

Abra a aplicação correspondente à API PGFN.

**[INSERIR PRINT 4 AQUI — Lista de aplicações ou botão de credenciais]**

### Passo 5 — Abrir a tela de chaves

Dentro da aplicação, procure a área onde aparecem:

- **Consumer Key**
- **Consumer Secret**

Também pode aparecer como:

- **Chave de consumo**
- **Segredo de consumo**
- **Client ID**
- **Client Secret**

**[INSERIR PRINT 5 AQUI — Tela mostrando Consumer Key e Consumer Secret]**

---

## 6. Copiar para o sistema

### Passo 6 — Copiar Consumer Key

Copie o valor do campo **Consumer Key**.

No sistema, ele entra em:

```env
PGFN_CLIENT_ID=valor_do_consumer_key
```

### Passo 7 — Copiar Consumer Secret

Copie o valor do campo **Consumer Secret**.

No sistema, ele entra em:

```env
PGFN_CLIENT_SECRET=valor_do_consumer_secret
```

**Atenção:** não cole token começando com `eyJ...` nesse campo. Se começar com `eyJ`, provavelmente é token temporário, não Consumer Secret.

---

## 7. Conferência final

Depois de preencher o `.env`, a seção PGFN deve ficar assim:

```env
# --- PGFN / Consulta Dívida Ativa Serpro (API independente) ---
PGFN_TOKEN_URL=https://gateway.apiserpro.serpro.gov.br/token
PGFN_BASE_URL=https://gateway.apiserpro.serpro.gov.br/consulta-divida-ativa-df/api
PGFN_CLIENT_ID=consumer_key_copiado_do_serpro
PGFN_CLIENT_SECRET=consumer_secret_copiado_do_serpro
```

Depois disso, reinicie o backend para o sistema carregar as novas variáveis.

---

## 8. Como saber se está certo

Está correto quando:

- `PGFN_CLIENT_ID` recebeu a **Consumer Key**
- `PGFN_CLIENT_SECRET` recebeu a **Consumer Secret**
- nenhum dos dois campos recebeu um token começando com `eyJ...`
- o backend consegue gerar token sozinho
- a consulta PGFN passa a responder sem erro de autenticação

Se a Serpro retornar erro `401`, normalmente significa:

1. Consumer Key ou Consumer Secret errado;
2. API PGFN não está vinculada à aplicação correta;
3. produto contratado não está ativo;
4. token foi colado no lugar do Consumer Secret;
5. aplicação não tem permissão para consumir a API Consulta Dívida Ativa.

---

## 9. Resumo para o Haylander

Haylander, você não precisa copiar o token pronto da Serpro. O sistema precisa das **duas chaves permanentes** da aplicação:

1. **Consumer Key** → vai em `PGFN_CLIENT_ID`
2. **Consumer Secret** → vai em `PGFN_CLIENT_SECRET`

Com essas duas informações, o backend gera o token automaticamente sempre que precisar consultar a Dívida Ativa/PGFN.

O token pronto que aparece no portal ou em testes manuais é temporário e expira. Por isso, ele não serve para deixar no `.env`.

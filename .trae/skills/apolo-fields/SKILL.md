---
name: "apolo-fields"
description: "Lista todos os campos da ficha do lead e como o Apolo os preenche. Invoke quando precisar consultar, atualizar ou entender a estrutura de dados do cliente no banco."
---

# Apolo Fields (Ficha do Lead)

Esta skill documenta a estrutura completa da ficha do cliente (tabelas `leads` e `leads_processo`) e as regras de preenchimento automático pelo Agente Apolo.

## 1. Dados Pessoais
- **`nome_completo`**: Preenchido no primeiro contato ou atualizado se o cliente corrigir.
- **`cpf`**: Extraído automaticamente via Serpro (CCMEI_DADOS) ou informado pelo cliente.
- **`email`, `data_nascimento`, `nome_mae`, `sexo`**: Informados pelo cliente na conversa ou formulário.
- **`senha_gov`**: Criptografada no banco se fornecida no fluxo assistido.

## 2. Dados da Empresa (Auto-preenchidos via BrasilAPI)
*Preenchidos em 1 segundo após o cliente enviar o CNPJ:*
- **`cnpj`**: Número do CNPJ.
- **`razao_social`**: Nome oficial da empresa.
- **`nome_fantasia`**: Nome fantasia (se houver).
- **`tipo_negocio`**: Atividade principal (CNAE).
- **`endereco`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `cep`**: Endereço completo.
- **`faturamento_mensal`**: Preenchido se o cliente responder na qualificação.

## 3. Dívidas e Regularização (Auto-preenchidos via Serpro)
*Atualizados automaticamente após a tool `consultar_pgmei_serpro`:*
- **`tem_divida`**: `true` se houver boleto atrasado (PGMEI) ou dívida ativa (PGFN).
- **`tipo_divida`**: "DAS", "Federal" ou "Federal e DAS".
- **`valor_divida_pgfn`**: Valor exato consolidado da dívida ativa (PGFN).
- **`valor_divida_municipal`, `valor_divida_estadual`, `valor_divida_federal`, `tempo_divida`, `calculo_parcelamento`**: Informados pelo cliente ou atualizados manualmente.

## 4. Qualificação e Interesse
- **`situacao`**: Status no funil (ex: "qualificado", "frio", "em_atendimento").
- **`qualificacao`**: Nota ou tag do lead.
- **`motivo_qualificacao`**: Justificativa da nota.
- **`interesse_ajuda`**: O que deseja resolver (ex: "Baixar MEI").
- **`possui_socio`**: Se mencionou ter sócios.

## 5. Processo e Atendimento
- **`servico`**: Serviço final negociado.
- **`status_atendimento`**: Etapa atual (ex: "bot", "atendimento_humano").
- **`data_reuniao`**: Preenchido via agendamento (Calendly/Formulário).
- **`procuracao_ativa`**: `true` quando a procuração e-CAC é confirmada na Serpro.
- **`procuracao_validade`**: Data de validade da procuração.
- **`observacoes`**: Resumos importantes concatenados pelo Apolo.

## Como Atualizar (Tool `update_user`)
O Apolo pode atualizar esses campos chamando a tool `update_user` e enviando as chaves na raiz do JSON.
Exemplo: `{ "situacao": "qualificado", "tem_divida": true, "tipo_divida": "DAS" }`
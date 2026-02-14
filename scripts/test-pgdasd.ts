import 'dotenv/config';
// import { getSerproTokens, request } from '../src/lib/serpro'; // Loaded dynamically
import https from 'node:https';
import path from 'node:path';
import fs from 'node:fs';

// Force load .env from root
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.warn(`[WARN] .env not found at ${envPath}`);
}

async function testPGDASD() {
  console.log('--- Iniciando Teste PGDAS-D ---');
  
  // Load serpro module dynamically to ensure env vars are loaded
  const { getSerproTokens, request } = await import('../src/lib/serpro');

  // Debug Env Vars (Masked)
  const clientId = process.env.SERPRO_CLIENT_ID;
  const clientSecret = process.env.SERPRO_CLIENT_SECRET;
  console.log(`Env Check: CLIENT_ID=${clientId ? '***' + clientId.slice(-4) : 'MISSING'}`);
  console.log(`Env Check: CLIENT_SECRET=${clientSecret ? '***' + clientSecret.slice(-4) : 'MISSING'}`);

  // Configuração

  // Configuração
  const idSistema = process.env.INTEGRA_PGDASD_ID_SISTEMA || 'PGDASD';
  const idServico = process.env.INTEGRA_PGDASD_ID_SERVICO || 'CONSDECLARACAO13';
  const versaoSistema = '1.0';
  
  // CNPJ para teste (Contratante e Contribuinte)
  const contratanteCnpjRaw = process.env.CONTRATANTE_CNPJ || '51564549000140';
  const contratanteCnpj = contratanteCnpjRaw.replace(/\D/g, '');
  
  // O CNPJ do contribuinte deve ser o mesmo do contratante para este teste, ou outro válido
  const contribuinteCnpjRaw = process.env.CONTRIBUINTE_CNPJ || contratanteCnpjRaw;
  const contribuinteCnpj = contribuinteCnpjRaw.replace(/\D/g, '');

  console.log(`Configuração:`);
  console.log(`- Sistema: ${idSistema}`);
  console.log(`- Serviço: ${idServico}`);
  console.log(`- Contratante: ${contratanteCnpj}`);
  console.log(`- Contribuinte: ${contribuinteCnpj}`);

  try {
    // 1. Obter Tokens
    console.log('\n[1/3] Obtendo tokens de acesso...');
    const tokens = await getSerproTokens();
    console.log('Tokens obtidos com sucesso.');

    // 2. Preparar Payload
    // PGDAS-D CONSDECLARACAO13 espera: { "anoCalendario": "YYYY" }
    const ano = new Date().getFullYear().toString(); // 2024/2025
    // Vamos testar com o ano anterior para garantir que haja dados, ou atual.
    const anoTeste = (new Date().getFullYear() - 1).toString(); // 2024 se for 2025

    const dadosServico = {
      anoCalendario: anoTeste
    };
    
    // Nota: NÃO incluímos 'cnpj' dentro de 'dados' pois a documentação não menciona.
    // O CNPJ vai no objeto 'contribuinte'.

    const payload = {
      contratante: { numero: contratanteCnpj, tipo: 2 },
      autorPedidoDados: { numero: contratanteCnpj, tipo: 2 }, // Assumindo auto-serviço ou procuração implicita
      contribuinte: { numero: contribuinteCnpj, tipo: 2 },
      pedidoDados: {
        idSistema,
        idServico,
        versaoSistema,
        dados: JSON.stringify(dadosServico),
      },
    };

    console.log('\n[2/3] Payload preparado:');
    console.log(JSON.stringify(payload, null, 2));

    // 3. Enviar Requisição
    console.log(`\n[3/3] Enviando requisição para PGDAS-D (${idServico})...`);
    
    // URL de Consultar
    const url = process.env.SERPRO_INTEGRA_CONSULTAR_URL || 'https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/Consultar';

    const result = await request(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'jwt_token': tokens.jwt_token,
          'Content-Type': 'application/json',
        },
      },
      JSON.stringify(payload)
    );

    console.log('\n--- Resultado PGDAS-D ---');
    console.log(JSON.stringify(result, null, 2));
    console.log('--- Sucesso ---');

  } catch (error: any) {
    console.error('\n--- Erro no Teste PGDAS-D ---');
    console.error(error.message || error);
    if (error.response) {
       console.error('Detalhes:', JSON.stringify(error.response.data));
    }
  }
}

testPGDASD();

import 'dotenv/config';
import { consultarServico, getSerproTokens } from '../src/lib/serpro';

async function test() {
  console.log('Testing Serpro Integration...');
  
  // 1. Check Env Vars
  console.log('Checking Environment Variables...');
  const cndSystem = process.env.INTEGRA_SITFIS_ID_SISTEMA;
  const cndService = process.env.INTEGRA_SITFIS_RELATORIO_ID_SERVICO;
  const dividaSystem = process.env.INTEGRA_PGMEI_ID_SISTEMA;
  const dividaService = process.env.INTEGRA_PGMEI_ID_SERVICO;
  
  console.log(`CND System (SITFIS): ${cndSystem}`);
  console.log(`CND Service (RELATORIO): ${cndService}`);
  console.log(`Divida Ativa System (PGMEI): ${dividaSystem}`);
  console.log(`Divida Ativa Service (PGMEI): ${dividaService}`);

  const certB64 = process.env.CERTIFICADO_BASE64;
  if (certB64) {
      console.log(`Cert B64 Length: ${certB64.length}`);
      console.log(`Cert B64 Start: ${certB64.substring(0, 20)}`);
  } else {
      console.error('CERTIFICADO_BASE64 is missing!');
  }

  // 2. Test Auth
  try {
    console.log('\nTesting Authentication...');
    const tokens = await getSerproTokens();
    console.log('Authentication Successful!');
    console.log('Access Token:', tokens.access_token.substring(0, 20) + '...');
  } catch (error) {
    console.error('Authentication Failed:', error);
    // Don't return, try to continue to see specific service errors if any
  }

  // 3. Test CND (using SITFIS)
  try {
    console.log('\nTesting CND (SITFIS)...');
    const cnpj = process.env.CONTRATANTE_CNPJ || '51564549000140';
    console.log(`Querying CNPJ: ${cnpj}`);
    const result = await consultarServico('CND', cnpj);
    console.log('CND Result:', JSON.stringify(result).substring(0, 200));
  } catch (error) {
    console.error('CND Test Failed:', error);
  }

  // 4. Test Divida Ativa
  try {
    console.log('\nTesting Divida Ativa...');
    const cnpj = process.env.CONTRATANTE_CNPJ || '51564549000140';
    const result = await consultarServico('DIVIDA_ATIVA', cnpj);
    console.log('Divida Ativa Result:', JSON.stringify(result).substring(0, 200));
  } catch (error) {
    console.error('Divida Ativa Test Failed:', error);
  }
}

test();

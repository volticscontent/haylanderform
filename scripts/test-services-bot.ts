import 'dotenv/config';
import { consultarServico, SERVICE_CONFIG } from '../src/lib/serpro';
import { saveConsultation } from '../src/lib/serpro-db';

async function testAllServicesBot() {
  console.log('=== Iniciando Teste Automatizado de Serviços Serpro (Modo Bot) ===');
  
  const cnpj = process.env.CONTRATANTE_CNPJ || '51564549000140'; // CNPJ padrão ou do env
  console.log(`CNPJ Alvo: ${cnpj}`);

  // Lista de serviços para testar
  const servicesToTest: (keyof typeof SERVICE_CONFIG)[] = [
    'CND',
    'DIVIDA_ATIVA',
    'PGDASD',
    'PARCELAMENTO_SN_CONSULTAR',
    'PARCELAMENTO_MEI_CONSULTAR',
    'DCTFWEB',
    'CAIXA_POSTAL',
    'CCMEI_DADOS'
  ];

  console.log(`Serviços a testar: ${servicesToTest.join(', ')}`);
  console.log('---------------------------------------------------');

  for (const service of servicesToTest) {
    console.log(`\n>>> Testando serviço: ${service}...`);
    try {
      // Configurar opções específicas se necessário
      const options: any = {};
      
      // Para PGDAS-D e outros que precisam de ano, usamos o ano atual
      if (['PGDASD', 'DIVIDA_ATIVA', 'DCTFWEB'].includes(service)) {
        options.ano = new Date().getFullYear().toString();
      }
      
      // Para DCTFWeb, definimos uma categoria padrão
      if (service === 'DCTFWEB') {
        options.categoria = 'GERAL_MENSAL';
        if (!options.mes) {
            options.mes = new Date().getMonth().toString().padStart(2, '0'); // Mês anterior ou atual
            if (options.mes === '00') options.mes = '12'; // Se for Janeiro (0), usa Dezembro
        }
      }

      console.log(`   Executando consulta... (Options: ${JSON.stringify(options)})`);
      const result = await consultarServico(service, cnpj, options);
      
      console.log(`   Sucesso! Resultado recebido.`);
      
      // Salvar como 'bot' para aparecer na aba específica do frontend
      console.log(`   Salvando no histórico do Bot...`);
      await saveConsultation(cnpj, service, result, 200, 'bot');
      
      console.log(`   [OK] ${service} testado e salvo.`);
    } catch (error: any) {
      console.error(`   [ERRO] Falha no serviço ${service}:`);
      console.error(`   ${error.message}`);
      
      // Tenta salvar o erro também para registro visual, se desejar (opcional, mas bom para debug)
      // await saveConsultation(cnpj, service, { error: error.message }, 500, 'bot');
    }
  }

  console.log('\n---------------------------------------------------');
  console.log('=== Teste Finalizado ===');
  console.log('Verifique a aba "Consultas do Bot" no painel admin (/admin/serpro) para ver os resultados.');
}

testAllServicesBot();

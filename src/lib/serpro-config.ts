
export interface ServiceConfigItem {
  env_sistema: string;
  env_servico: string;
  default_sistema?: string;
  default_servico?: string;
  tipo: 'Consultar' | 'Emitir' | 'Solicitar' | 'Apoiar';
  descricao?: string;
  uso?: string;
  finalidade?: string;
}

// Catálogo de Serviços do Integra Contador (Serpro)
// Padronizado com as variáveis de ambiente do .env e Catálogo 2025/2026
export const SERVICE_CONFIG: Record<string, ServiceConfigItem> = {
  // --- GRUPO CCMEI (Dados Cadastrais) ---
  CCMEI_DADOS: {
    env_sistema: 'INTEGRA_CCMEI_ID_SISTEMA',
    env_servico: 'INTEGRA_CCMEI_DADOS_ID_SERVICO',
    default_sistema: 'CCMEI',
    default_servico: 'DADOSCCMEI122',
    tipo: 'Consultar',
    descricao: 'Consulta dados cadastrais completos do MEI.',
    uso: 'Requer apenas CNPJ.',
    finalidade: 'Verificar situação cadastral, atividades e endereço.'
  },

  // --- GRUPO PGMEI (Débitos e Guias MEI) ---
  PGMEI: {
    env_sistema: 'INTEGRA_PGMEI_ID_SISTEMA',
    env_servico: 'INTEGRA_PGMEI_ID_SERVICO',
    default_sistema: 'PGMEI',
    default_servico: 'DIVIDAATIVA24',
    tipo: 'Consultar',
    descricao: 'Consulta débitos e dívida ativa do MEI.',
    uso: 'Requer CNPJ e Ano (opcional).',
    finalidade: 'Verificar débitos pendentes e inscritos em Dívida Ativa.'
  },
  PGMEI_EXTRATO: {
    env_sistema: 'INTEGRA_PGMEI_ID_SISTEMA',
    env_servico: 'INTEGRA_PGMEI_GERARDASPDF_ID_SERVICO',
    default_sistema: 'PGMEI',
    default_servico: 'GERARDASPDF21',
    tipo: 'Emitir',
    descricao: 'Geração de PDF do DAS (Extrato/Boleto).',
    uso: 'Requer CNPJ e Período (MM/AAAA).',
  },
  PGMEI_BOLETO: {
    env_sistema: 'INTEGRA_PGMEI_ID_SISTEMA',
    env_servico: 'INTEGRA_PGMEI_GERARDASCODBARRA_ID_SERVICO',
    default_sistema: 'PGMEI',
    default_servico: 'GERARDASCODBARRA22',
    tipo: 'Emitir',
    descricao: 'Geração de Código de Barras do DAS.',
    uso: 'Requer CNPJ e Período (MM/AAAA).',
  },
  PGMEI_ATU_BENEFICIO: {
    env_sistema: 'INTEGRA_PGMEI_ID_SISTEMA',
    env_servico: 'INTEGRA_PGMEI_ATUBENEFICIO_ID_SERVICO',
    default_sistema: 'PGMEI',
    default_servico: 'ATUBENEFICIO23',
    tipo: 'Emitir',
    descricao: 'Atualização de Benefícios Previdenciários no PGMEI.',
    uso: 'Requer CNPJ.',
  },

  // --- GRUPO SIMEI (Situação de Enquadramento) ---
  SIMEI: {
    env_sistema: 'INTEGRA_SIMEI_ID_SISTEMA',
    env_servico: 'INTEGRA_SIMEI_ID_SERVICO',
    default_sistema: 'CCMEI',
    default_servico: 'DADOSCCMEI122',
    tipo: 'Consultar',
    descricao: 'Consulta enquadramento no SIMEI (via CCMEI).',
    uso: 'Requer CNPJ e Ano.',
    finalidade: 'Verificar se a empresa é optante pelo SIMEI.'
  },

  // --- GRUPO SITFIS (Situação Fiscal Completa) ---
  SIT_FISCAL_SOLICITAR: {
    env_sistema: 'INTEGRA_SITFIS_ID_SISTEMA',
    env_servico: 'INTEGRA_SITFIS_PROTOCOLO_ID_SERVICO',
    default_sistema: 'SITFIS',
    default_servico: 'SOLICITARPROTOCOLO91',
    tipo: 'Apoiar',
    descricao: 'Solicitar Protocolo de Situação Fiscal.',
    uso: 'Requer CNPJ.',
    finalidade: 'Primeiro passo para o diagnóstico completo de pendências.'
  },
  SIT_FISCAL_RELATORIO: {
    env_sistema: 'INTEGRA_SITFIS_ID_SISTEMA',
    env_servico: 'INTEGRA_SITFIS_RELATORIO_ID_SERVICO',
    default_sistema: 'SITFIS',
    default_servico: 'RELATORIOSITFIS92',
    tipo: 'Emitir',
    descricao: 'Relatório de Situação Fiscal Completa.',
    uso: 'Requer número do protocolo obtido na solicitação.',
    finalidade: 'Obtenção do relatório detalhado em PDF/JSON.'
  },

  // --- GRUPO DASN-SIMEI (Declaração Anual MEI) ---
  DASN_SIMEI: {
    env_sistema: 'INTEGRA_DASNSIMEI_ID_SISTEMA',
    env_servico: 'INTEGRA_DASNSIMEI_ID_SERVICO',
    default_sistema: 'DASNSIMEI',
    default_servico: 'CONSULTIMADECREC152',
    tipo: 'Consultar',
    descricao: 'Consulta Declaração Anual do MEI (DASN).',
    uso: 'Requer CNPJ e Ano.',
    finalidade: 'Consultar recibos e situação de declarações do MEI.'
  },

  // --- GRUPO PGDAS-D (Simples Nacional) ---
  PGDASD: {
    env_sistema: 'INTEGRA_PGDASD_ID_SISTEMA',
    env_servico: 'INTEGRA_PGDASD_CONSEXTRATO_ID_SERVICO',
    default_sistema: 'PGDASD',
    default_servico: 'CONSEXTRATO16',
    tipo: 'Consultar',
    descricao: 'Extrato PGDAS-D (Simples Nacional).',
    uso: 'Requer CNPJ e Ano Calendário.',
    finalidade: 'Consultar declarações transmitidas e situação do PGDAS-D.'
  },

  // --- GRUPO DCTFWEB ---
  DCTFWEB: {
    env_sistema: 'INTEGRA_DCTFWEB_ID_SISTEMA',
    env_servico: 'INTEGRA_DCTFWEB_ID_SERVICO',
    default_sistema: 'DCTFWEB',
    default_servico: 'CONSDECCOMPLETA33',
    tipo: 'Consultar',
    descricao: 'Consulta Declaração DCTFWeb Completa.',
    uso: 'Requer CNPJ e Período (MM/AAAA).',
    finalidade: 'Consultar débitos e créditos tributários previdenciários.'
  },

  // --- GRUPO PARCELAMENTOS ---
  PARCELAMENTO_MEI_CONSULTAR: {
    env_sistema: 'INTEGRA_PARCMEI_SISTEMA',
    env_servico: 'INTEGRA_PARCMEI_CONSULTAR_SERVICO',
    default_sistema: 'PARCMEI',
    default_servico: 'PEDIDOSPARC203',
    tipo: 'Consultar',
    descricao: 'Consulta Pedidos de Parcelamento MEI.',
    finalidade: 'Verificar status e parcelas de acordos ativos.'
  },
  PARCELAMENTO_MEI_EMITIR: {
    env_sistema: 'INTEGRA_PARCMEI_SISTEMA',
    env_servico: 'INTEGRA_PARCMEI_GERAR_SERVICO',
    default_sistema: 'PARCMEI',
    default_servico: 'GERARDAS201',
    tipo: 'Emitir',
    descricao: 'Emissão de DAS de Parcelamento MEI.',
  },
  PARCELAMENTO_SN_CONSULTAR: {
    env_sistema: 'INTEGRA_PARCSN_SISTEMA',
    env_servico: 'INTEGRA_PARCSN_CONSULTAR_SERVICO',
    default_sistema: 'PARCSN',
    default_servico: 'PEDIDOSPARC163',
    tipo: 'Consultar',
    descricao: 'Consulta Pedidos de Parcelamento SN.',
  },

  // --- GRUPO DÍVIDA ATIVA PGFN ---
  PGFN_PAEX: {
    env_sistema: 'INTEGRA_PGFN_PAEX_ID_SISTEMA',
    env_servico: 'INTEGRA_PGFN_PAEX_ID_SERVICO',
    default_sistema: 'PARC-PAEX',
    default_servico: 'OBTEREXTRATOPARC245',
    tipo: 'Consultar',
    descricao: 'Parcelamento Excepcional PGFN (PAEX).',
    uso: 'Requer CNPJ.',
  },
  PGFN_SIPADE: {
    env_sistema: 'INTEGRA_PGFN_SIPADE_ID_SISTEMA',
    env_servico: 'INTEGRA_PGFN_SIPADE_ID_SERVICO',
    default_sistema: 'PARC-SIPADE',
    default_servico: 'OBTEREXTRATOPARC251',
    tipo: 'Consultar',
    descricao: 'Parcelamento de Débitos PGFN (SIPADE).',
    uso: 'Requer CNPJ.',
  },

  // --- GRUPO CERTIDÕES E OUTROS ---
  CND: {
    env_sistema: 'INTEGRA_SITFIS_ID_SISTEMA',
    env_servico: 'INTEGRA_SITFIS_RELATORIO_ID_SERVICO',
    default_sistema: 'SITFIS',
    default_servico: 'RELATORIOSITFIS92',
    tipo: 'Emitir',
    descricao: 'Certidão Negativa de Débitos (via SITFIS).',
    finalidade: 'Comprovar regularidade fiscal perante a Receita Federal.'
  },
  PROCESSOS: {
    env_sistema: 'INTEGRA_PROCESSOS_ID_SISTEMA',
    env_servico: 'INTEGRA_PROCESSOS_ID_SERVICO',
    default_sistema: 'EPROCESSO',
    default_servico: 'CONSPROCPORINTER271',
    tipo: 'Consultar',
    descricao: 'Consulta de Processos Administrativos.',
  },
  CAIXA_POSTAL: {
    env_sistema: 'INTEGRA_CAIXA_POSTAL_ID_SISTEMA',
    env_servico: 'INTEGRA_CAIXA_POSTAL_ID_SERVICO',
    default_sistema: 'CAIXAPOSTAL',
    default_servico: 'MSGCONTRIBUINTE61',
    tipo: 'Consultar',
    descricao: 'Caixa Postal Eletrônica (DTE).',
    finalidade: 'Ler mensagens e intimações oficiais.'
  },
  PROCURACAO: {
    env_sistema: 'INTEGRA_PROCURACAO_ID_SISTEMA',
    env_servico: 'INTEGRA_PROCURACAO_ID_SERVICO',
    default_sistema: 'PROCURACOES',
    default_servico: 'OBTERPROCURACAO41',
    tipo: 'Consultar',
    descricao: 'Consulta de Procurações Eletrônicas.',
    finalidade: 'Verificar poderes do contador no e-CAC.'
  },

  // --- SERVIÇOS ADICIONAIS (do Bot) ---
  PAGAMENTO: {
    env_sistema: 'INTEGRA_PAGAMENTO_ID_SISTEMA',
    env_servico: 'INTEGRA_PAGAMENTO_ID_SERVICO',
    default_sistema: 'PAGTOWEB',
    default_servico: 'COMPARRECADACAO72',
    tipo: 'Consultar',
    descricao: 'Consulta de Comprovantes de Arrecadação.',
    finalidade: 'Verificar pagamentos realizados pelo contribuinte.'
  },
  DIVIDA_ATIVA: {
    env_sistema: 'INTEGRA_DIVIDA_ATIVA_ID_SISTEMA',
    env_servico: 'INTEGRA_DIVIDA_ATIVA_ID_SERVICO',
    default_sistema: 'PGMEI',
    default_servico: 'DIVIDAATIVA24',
    tipo: 'Consultar',
    descricao: 'Consulta de Dívida Ativa da União.',
    finalidade: 'Verificar inscrições em dívida ativa federal.'
  },
  PGFN_CONSULTAR: {
    env_sistema: 'INTEGRA_PGFN_ID_SISTEMA',
    env_servico: 'INTEGRA_PGFN_CONSULTA_ID_SERVICO',
    default_sistema: 'PGMEI',
    default_servico: 'DIVIDAATIVA24',
    tipo: 'Consultar',
    descricao: 'Consulta de débitos em Dívida Ativa da União (MEI).',
    finalidade: 'Para geral, use SITFIS.'
  },
  PARCELAMENTO_SN_EMITIR: {
    env_sistema: 'INTEGRA_PARCSN_SISTEMA',
    env_servico: 'INTEGRA_PARCSN_GERAR_SERVICO',
    default_sistema: 'PARCSN',
    default_servico: 'GERARDAS161',
    tipo: 'Emitir',
    descricao: 'Emissão de DAS de Parcelamento Simples Nacional.',
    finalidade: 'Gerar guia de pagamento de parcela SN.'
  }
};

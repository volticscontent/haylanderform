import https from 'node:https';
import querystring from 'node:querystring';
import fs from 'node:fs';
import path from 'node:path';

// Environment variables should be set in .env.local
// Helper to handle newlines in env vars (common issue with PEMs in Vercel)
const formatPem = (key: string | undefined) => {
  if (!key) return undefined;
  // If the key is just one long line with \n literals, replace them with actual newlines
  return key.replace(/\\n/g, '\n');
};

const getCertContent = (contentEnv: string | undefined, pathEnv: string | undefined): string | undefined => {
  if (contentEnv) return formatPem(contentEnv);
  
  if (pathEnv) {
    try {
      const certPath = path.resolve(process.cwd(), pathEnv);
      if (fs.existsSync(certPath)) {
        return fs.readFileSync(certPath, 'utf8');
      }
      console.warn(`Certificado não encontrado no caminho: ${certPath}`);
    } catch (error) {
      console.error(`Erro ao ler certificado do caminho ${pathEnv}:`, error);
    }
  }
  return undefined;
};

const SERPRO_CLIENT_ID = process.env.SERPRO_CLIENT_ID;
const SERPRO_CLIENT_SECRET = process.env.SERPRO_CLIENT_SECRET;
const SERPRO_CERT_PEM = getCertContent(process.env.SERPRO_CERT_PEM, process.env.SERPRO_CERT_PEM_PATH);
const SERPRO_CERT_KEY = getCertContent(process.env.SERPRO_CERT_KEY, process.env.SERPRO_CERT_KEY_PATH);
const SERPRO_CERT_PFX_B64 = process.env.CERTIFICADO_BASE64 ? process.env.CERTIFICADO_BASE64.replace(/^"|"$/g, '').trim() : undefined;
const SERPRO_CERT_PFX_PATH = process.env.SERPRO_CERT_PFX_PATH;
const SERPRO_PFX_BUFFER = (SERPRO_CERT_PFX_PATH && fs.existsSync(SERPRO_CERT_PFX_PATH))
  ? fs.readFileSync(SERPRO_CERT_PFX_PATH)
  : (SERPRO_CERT_PFX_B64 ? Buffer.from(SERPRO_CERT_PFX_B64, 'base64') : undefined);

const SERPRO_CERT_PASS = process.env.CERTIFICADO_SENHA;
const SERPRO_ROLE_TYPE = process.env.SERPRO_ROLE_TYPE || 'TERCEIROS';
const SERPRO_AUTHENTICATE_URL = process.env.SERPRO_AUTHENTICATE_URL || 'https://autenticacao.sapi.serpro.gov.br/authenticate';

// URLs for services
const INTEGRA_BASE_URLS = {
  Consultar: process.env.SERPRO_INTEGRA_CONSULTAR_URL || 'https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/Consultar',
  Emitir: 'https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/Emitir',
  Solicitar: 'https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/Solicitar',
};

// Service Configs
export const SERVICE_CONFIG = {
  CCMEI_DADOS: {
    env_sistema: 'INTEGRA_CCMEI_ID_SISTEMA',
    env_servico: 'INTEGRA_CCMEI_DADOS_ID_SERVICO',
    tipo: 'Consultar',
  },
  PGMEI: {
    env_sistema: 'INTEGRA_PGMEI_ID_SISTEMA',
    env_servico: 'INTEGRA_PGMEI_ID_SERVICO',
    tipo: 'Consultar',
  },
  SIMEI: {
    env_sistema: 'INTEGRA_SIMEI_ID_SISTEMA',
    env_servico: 'INTEGRA_SIMEI_ID_SERVICO',
    tipo: 'Consultar',
  },
  SIT_FISCAL: {
    env_sistema: 'INTEGRA_SITFIS_ID_SISTEMA',
    env_servico: 'INTEGRA_SITFIS_RELATORIO_ID_SERVICO',
    tipo: 'Emitir',
    versao: '2.0',
  },
  DIVIDA_ATIVA: {
    env_sistema: 'INTEGRA_PGMEI_ID_SISTEMA',
    env_servico: 'INTEGRA_PGMEI_ID_SERVICO',
    tipo: 'Consultar',
    versao: '1.0',
  },
  CND: {
    env_sistema: 'INTEGRA_SITFIS_ID_SISTEMA',
    env_servico: 'INTEGRA_SITFIS_RELATORIO_ID_SERVICO',
    tipo: 'Emitir',
    versao: '2.0',
  },
  PARCELAMENTO: {
    env_sistema: 'INTEGRA_PARCELAMENTO_ID_SISTEMA',
    env_servico: 'INTEGRA_PARCELAMENTO_ID_SERVICO',
    tipo: 'Consultar',
  },
  DASN_SIMEI: {
    env_sistema: 'INTEGRA_DASN_SIMEI_ID_SISTEMA',
    env_servico: 'INTEGRA_DASN_SIMEI_ID_SERVICO',
    tipo: 'Consultar',
  },
  PROCESSOS: {
    env_sistema: 'INTEGRA_PROCESSOS_ID_SISTEMA',
    env_servico: 'INTEGRA_PROCESSOS_ID_SERVICO',
    tipo: 'Consultar',
  }
};

const onlyDigits = (v: string) => v.replace(/\D/g, '');


interface SerproTokens {
  access_token: string;
  jwt_token: string;
}

/**
 * Helper to make HTTPS requests with client certificates
 */
async function request(
  urlStr: string,
  options: https.RequestOptions,
  body?: string
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const reqOptions: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers,
      // Inject client certificates
      // Use PFX if available (preferred if PEM is missing)
      ...(SERPRO_PFX_BUFFER 
        ? { 
            pfx: SERPRO_PFX_BUFFER,
            passphrase: SERPRO_CERT_PASS 
          } 
        : {
            cert: SERPRO_CERT_PEM,
            key: SERPRO_CERT_KEY,
          }
      ),
      timeout: 30000, // 30s timeout
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        } else {
          // Tenta extrair mensagem de erro detalhada do Serpro
          let errorMessage = `HTTP ${res.statusCode}`;
          try {
            const errObj = JSON.parse(data);
            if (errObj.mensagens && Array.isArray(errObj.mensagens)) {
              const msgs = errObj.mensagens.map((m: { codigo: string; texto: string }) => `[${m.codigo}] ${m.texto}`).join(' | ');
              errorMessage += `: ${msgs}`;
            } else if (errObj.error) {
              errorMessage += `: ${errObj.error}`;
            } else {
              errorMessage += `: ${data.substring(0, 1000)}`;
            }
          } catch {
            errorMessage += `: ${data.substring(0, 1000)}`;
          }
          reject(new Error(errorMessage));
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

let cachedTokens: SerproTokens | null = null;

export async function getSerproTokens(): Promise<SerproTokens> {
  if (cachedTokens) {
    // In a real app, check expiration. For now, simple cache.
    return cachedTokens;
  }

  if (!SERPRO_CLIENT_ID || !SERPRO_CLIENT_SECRET) {
    throw new Error('Credenciais do SERPRO ausentes (ID ou SECRET)');
  }
  
  if (!SERPRO_PFX_BUFFER && (!SERPRO_CERT_PEM || !SERPRO_CERT_KEY)) {
    throw new Error('Certificado do SERPRO ausente (CERTIFICADO_BASE64, SERPRO_CERT_PFX_PATH ou SERPRO_CERT_PEM/KEY)');
  }

  const authHeader = 'Basic ' + Buffer.from(`${SERPRO_CLIENT_ID}:${SERPRO_CLIENT_SECRET}`).toString('base64');
  const postData = querystring.stringify({ grant_type: 'client_credentials' });

  const response = await request(
    SERPRO_AUTHENTICATE_URL,
    {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Role-Type': SERPRO_ROLE_TYPE,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    },
    postData
  );

  if ((response as SerproTokens).access_token && (response as SerproTokens).jwt_token) {
    cachedTokens = {
      access_token: (response as SerproTokens).access_token,
      jwt_token: (response as SerproTokens).jwt_token,
    };
    return cachedTokens;
  }

  throw new Error('Falha ao recuperar tokens do SERPRO');
}

export interface SerproOptions {
  ano?: string;
  mes?: string;
  numeroRecibo?: string;
  codigoReceita?: string;
}

export async function consultarServico(nomeServico: keyof typeof SERVICE_CONFIG, cnpj: string, options: SerproOptions = {}) {
  const config = SERVICE_CONFIG[nomeServico];
  if (!config) throw new Error(`Serviço ${nomeServico} não configurado`);

  const idSistema = process.env[config.env_sistema];
  const idServico = process.env[config.env_servico];

  if (!idSistema || !idServico) {
    const missing = [];
    if (!idSistema) missing.push(config.env_sistema);
    if (!idServico) missing.push(config.env_servico);
    throw new Error(`IDs não configurados para ${nomeServico}. Variáveis ausentes: ${missing.join(', ')}`);
  }

  const tokens = await getSerproTokens();
  
  const cnpjNumero = onlyDigits(cnpj);
  if (cnpjNumero.length !== 14) {
    throw new Error('CNPJ inválido: envie 14 dígitos (somente números)');
  }

  const dadosServico: Record<string, unknown> = { cnpj: cnpjNumero };
  
  // Tratamento de parâmetros específicos por serviço
  if (nomeServico === 'PGMEI' || nomeServico === 'SIMEI' || nomeServico === 'DIVIDA_ATIVA') {
    // Tratamento de ANO
    if (options.ano) {
      if (nomeServico === 'PGMEI' || nomeServico === 'DIVIDA_ATIVA') {
        dadosServico.anoCalendario = options.ano;
      } else {
        dadosServico.ano = options.ano;
      }
    } else if (nomeServico === 'PGMEI' || nomeServico === 'DIVIDA_ATIVA') {
      // Default ano atual para PGMEI e DIVIDA_ATIVA
      dadosServico.anoCalendario = new Date().getFullYear().toString();
    }

    // Tratamento de MÊS (Período de Apuração para PGMEI/DAS)
    if (options.mes && nomeServico === 'PGMEI') {
      // Se tiver mês, assume que é para gerar DAS ou consultar apuração específica
      // O formato geralmente espera o período completo (PA) ou mês separado.
      // Vamos enviar como 'periodoApuracao' concatenado se tiver ano, ou campo 'mes' se a API especificar.
      // Por padrão do Integra, muitas vezes é 'periodoApuracao': 'MMAAAA'
      const anoParaMes = options.ano || new Date().getFullYear().toString();
      const mesFormatado = options.mes.padStart(2, '0');
      dadosServico.periodoApuracao = `${mesFormatado}${anoParaMes}`;
    }
  }

  // Outros parâmetros genéricos
  if (options.numeroRecibo) {
    dadosServico.numeroRecibo = options.numeroRecibo;
  }
  
  if (options.codigoReceita) {
    dadosServico.codigoReceita = options.codigoReceita;
  }

  const contratanteCnpjRaw = process.env.CONTRATANTE_CNPJ || '51564549000140';
  const contratanteCnpj = onlyDigits(contratanteCnpjRaw);

  const payload = {
    contratante: { numero: contratanteCnpj, tipo: 2 },
    autorPedidoDados: { numero: contratanteCnpj, tipo: 2 },
    contribuinte: { numero: cnpjNumero, tipo: 2 },
    pedidoDados: {
      idSistema,
      idServico,
      versaoSistema: (config as any).versao || '1.0',
      dados: JSON.stringify(dadosServico),
    },
  };

  console.log(`[SERPRO] Consultando ${nomeServico} (${idSistema}/${idServico}) para CNPJ ${cnpjNumero}`);
  console.log('[SERPRO] Dados internos:', JSON.stringify(dadosServico, null, 2));

  // Select Base URL based on service type
  const serviceType = config.tipo as keyof typeof INTEGRA_BASE_URLS;
  const baseUrl = INTEGRA_BASE_URLS[serviceType] || INTEGRA_BASE_URLS['Consultar'];

  return request(
    baseUrl,
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
}

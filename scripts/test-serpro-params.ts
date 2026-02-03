import 'dotenv/config';
import { getSerproTokens } from '../src/lib/serpro';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

// Re-implement request logic locally to allow flexibility in testing URL/Body
const SERPRO_PFX_PATH = process.env.SERPRO_CERT_PFX_PATH;
const SERPRO_PFX = (SERPRO_PFX_PATH && fs.existsSync(SERPRO_PFX_PATH)) 
    ? fs.readFileSync(SERPRO_PFX_PATH) 
    : (process.env.CERTIFICADO_BASE64 ? Buffer.from(process.env.CERTIFICADO_BASE64, 'base64') : undefined);
const SERPRO_PASS = process.env.CERTIFICADO_SENHA;

async function rawRequest(urlStr: string, method: string, token: string, jwt: string, body: any) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const reqOptions = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'jwt_token': jwt,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
            pfx: SERPRO_PFX,
            passphrase: SERPRO_PASS,
            timeout: 30000
        };

        const req = https.request(reqOptions, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch {
                    resolve({ status: res.statusCode, data: data, headers: res.headers });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function test() {
    console.log('Obtaining tokens...');
    const tokens = await getSerproTokens();
    const cnpj = process.env.CONTRATANTE_CNPJ || '51564549000140';
    const cnpjOnlyDigits = cnpj.replace(/\D/g, '');

    // Common Payload Structure with Version
    const createPayload = (idSistema: string, idServico: string, dados: any, version: string = '1.0') => ({
        contratante: { numero: cnpjOnlyDigits, tipo: 2 },
        autorPedidoDados: { numero: cnpjOnlyDigits, tipo: 2 },
        contribuinte: { numero: cnpjOnlyDigits, tipo: 2 },
        pedidoDados: {
            idSistema,
            idServico,
            versaoSistema: version,
            dados: JSON.stringify(dados),
        },
    });

    // TEST 1: Divida Ativa (PGMEI/DIVIDA_ATIVA) - Consultar
    console.log('\n--- Testing Divida Ativa (PGMEI/DIVIDA_ATIVA) ---');
    const daSystem = process.env.INTEGRA_PGMEI_ID_SISTEMA || 'PGMEI';
    const daService = process.env.INTEGRA_PGMEI_ID_SERVICO || 'DIVIDA_ATIVA';
    
    // Test with anoCalendario
    const daParams = { 
        cnpj: cnpjOnlyDigits,
        anoCalendario: new Date().getFullYear().toString()
    };

    console.log(`Trying Divida Ativa on Consultar with params: ${JSON.stringify(daParams)}`);
    const resDA: any = await rawRequest(
        'https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/Consultar',
        'POST',
        tokens.access_token,
        tokens.jwt_token,
        createPayload(daSystem, daService, daParams, '1.0')
    );
    console.log(`Status: ${resDA.status}`);
    if (resDA.status === 200) {
        console.log('SUCCESS Divida Ativa!');
        console.log(JSON.stringify(resDA.data).substring(0, 200));
    } else {
        const err = typeof resDA.data === 'string' ? resDA.data : JSON.stringify(resDA.data);
        console.log('Error Divida Ativa:', err.substring(0, 500));
    }

    // --- CND Flow Test ---
    console.log(`\n--- Testing CND Flow (Apoiar -> Emitir) ---`);

    const cndSystem = process.env.INTEGRA_SITFIS_ID_SISTEMA || 'SITFIS';
    const protocoloService = process.env.INTEGRA_SITFIS_PROTOCOLO_ID_SERVICO || 'SOLICITARPROTOCOLO91';
    const relatorioService = process.env.INTEGRA_SITFIS_RELATORIO_ID_SERVICO || 'RELATORIOSITFIS92';
    
    // Step 1: Solicitar Protocolo (Apoiar endpoint, v2.0)
    console.log(`\n[Step 1] Requesting Protocol via ${protocoloService} on Apoiar (v2.0)...`);
    let protocoloData: any = null;
    try {
        // Revert to v2.0
        // Add timestamp to bust cache
        const payloadData = { 
            cnpj: cnpjOnlyDigits, 
            _ts: Date.now() 
        };

        const resProto: any = await rawRequest(
            'https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/Apoiar',
            'POST',
            tokens.access_token,
            tokens.jwt_token,
            createPayload(cndSystem, protocoloService, payloadData, '2.0')
        );
        
        console.log(`Status: ${resProto.status}`);
        if (resProto.status === 200) {
            console.log('SUCCESS Protocolo!');
            console.log(JSON.stringify(resProto.data, null, 2));
            protocoloData = resProto.data;
        } else if (resProto.status === 304) {
            console.log('FAIL Protocolo: 304 Not Modified');
            console.log('Headers:', JSON.stringify(resProto.headers, null, 2));
            
            // Try to extract protocol from ETag
            // ETag: "protocoloRelatorio:..."
            const etag = resProto.headers['etag'];
            if (etag && typeof etag === 'string') {
                const cleanEtag = etag.replace(/^"|"$/g, ''); // Remove quotes
                if (cleanEtag.startsWith('protocoloRelatorio:')) {
                    const b64 = cleanEtag.replace('protocoloRelatorio:', '');
                    try {
                        console.log('Decoded ETag:', Buffer.from(b64, 'base64').toString('utf8'));
                    } catch (e) { console.log('Could not decode ETag'); }
                    
                    protocoloData = {
                        dados: {
                            numeroProtocolo: b64
                        }
                    };
                    console.log('Extracted Protocol from ETag:', protocoloData.dados.numeroProtocolo);
                }
            }
        } else {
            console.log('FAIL Protocolo:', JSON.stringify(resProto.data, null, 2));
            return; // Stop if protocol fails
        }
    } catch (e: any) {
        console.log('EXCEPTION Protocolo:', e.message);
        return;
    }

    // Step 2: Emitir Relatório (Emitir endpoint, v2.0) using Protocol
    // Also try DIRECT emission without protocol
    console.log(`\n[Step 2-Direct] Trying Direct Relatório via ${relatorioService} (v2.0) without protocol...`);
    try {
        const resDirect: any = await rawRequest(
            'https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/Emitir',
            'POST',
            tokens.access_token,
            tokens.jwt_token,
            createPayload(cndSystem, relatorioService, { cnpj: cnpjOnlyDigits }, '2.0')
        );
        console.log(`Status Direct: ${resDirect.status}`);
        if (resDirect.status === 200) {
            console.log('SUCCESS Relatório Direct!');
            console.log(JSON.stringify(resDirect.data).substring(0, 500));
        } else {
            console.log('FAIL Relatório Direct:', JSON.stringify(resDirect.data, null, 2));
        }
    } catch (e: any) {
        console.log('EXCEPTION Relatório Direct:', e.message);
    }

    if (protocoloData && protocoloData.dados) {
        // Parse the inner 'dados' string if it's a string, or use as object
        let innerDados = protocoloData.dados;
        if (typeof innerDados === 'string') {
            try { innerDados = JSON.parse(innerDados); } catch (e) {}
        }
        
        const protocoloNumber = innerDados.numeroProtocolo || innerDados.protocolo;
        console.log(`\n[Step 2] Using Protocol Number: ${protocoloNumber} to Emitir Relatório via ${relatorioService} (v2.0)...`);
        
        // Construct payload for Relatório - assuming it needs protocol
        // We'll try a few variations if we don't know the exact field name
        const payloadData = { 
            cnpj: cnpjOnlyDigits, 
            numeroProtocolo: protocoloNumber 
        };

        try {
            const resRel: any = await rawRequest(
                'https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/Emitir',
                'POST',
                tokens.access_token,
                tokens.jwt_token,
                createPayload(cndSystem, relatorioService, payloadData, '2.0')
            );
            
            console.log(`Status: ${resRel.status}`);
            if (resRel.status === 200) {
                console.log('SUCCESS Relatório!');
                console.log(JSON.stringify(resRel.data).substring(0, 500));
            } else {
                console.log('FAIL Relatório:', JSON.stringify(resRel.data, null, 2));
                
                // If failed, try another payload variation just in case
                console.log('Trying alternative payload with just "protocolo"...');
                 const resRel2: any = await rawRequest(
                    'https://gateway.apiserpro.serpro.gov.br/integra-contador/v1/Emitir',
                    'POST',
                    tokens.access_token,
                    tokens.jwt_token,
                    createPayload(cndSystem, relatorioService, { protocolo: protocoloNumber }, '2.0')
                );
                console.log(`Status 2: ${resRel2.status}`);
                 if (resRel2.status === 200) {
                    console.log('SUCCESS Relatório 2!');
                    console.log(JSON.stringify(resRel2.data).substring(0, 500));
                } else {
                    console.log('FAIL Relatório 2:', JSON.stringify(resRel2.data, null, 2));
                }
            }
        } catch (e: any) {
            console.log('EXCEPTION Relatório:', e.message);
        }
    } else {
        console.log('Could not extract protocol data to proceed to Step 2.');
    }

}

test().catch(console.error);

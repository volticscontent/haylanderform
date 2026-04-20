'use server';

import { uploadFileToR2 } from '@/lib/r2';
import { backendPost } from '@/lib/backend-proxy';

export interface SavedDocumento {
  id: string;
  r2_url: string;
  valido_ate: string | null;
}

/**
 * Faz upload do PDF para o R2 e registra os metadados via backend.
 * A lógica de validade (VALIDITY_DAYS) fica exclusivamente no backend (serpro-db.ts).
 * O frontend envia valido_ate=null e o backend calcula conforme o tipo de serviço.
 */
export async function savePdfToR2(
  pdfBase64: string,
  cnpj: string,
  protocolo: string,
  tipoServico: string,
): Promise<{ success: true; documento: SavedDocumento } | { success: false; error: string }> {
  try {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    const dateStr = new Date().toISOString().split('T')[0];
    const safeProtocolo = protocolo.replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 50);
    const r2Key = `serpro-docs/${tipoServico}/${cleanCnpj}/${dateStr}-${safeProtocolo}.pdf`;

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const r2Url = await uploadFileToR2(pdfBuffer, r2Key, 'application/pdf');

    const res = await backendPost('/api/serpro/documentos', {
      cnpj: cleanCnpj,
      tipo_servico: tipoServico,
      protocolo,
      r2_key: r2Key,
      r2_url: r2Url,
      tamanho_bytes: pdfBuffer.length,
      gerado_por: 'admin',
      metadata: { protocolo, tipoServico },
    });

    const saved = await res.json() as { id: string; valido_ate?: string | null };
    return { success: true, documento: { id: saved.id, r2_url: r2Url, valido_ate: saved.valido_ate ?? null } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

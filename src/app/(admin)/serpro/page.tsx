'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DataViewer } from '@/components/serpro/DataViewer';
import LastConsultedClients from '@/components/serpro/LastConsultedClients';
import { SerproHealthMonitor } from '@/components/serpro/SerproHealthMonitor';
import { SERVICE_CONFIG, ServiceConfigItem } from '@/lib/serpro-config';
import { savePdfToR2 } from './actions';
import { fetchSitfisRelatorio } from '@/lib/sitfis-flow';
import { validateCnpj } from '@/lib/format';

interface SerproResponse {
  mensagens?: Array<{ codigo?: string; texto?: string }>;
  primary?: Record<string, unknown>;
  fallback?: Record<string, unknown>;
  [key: string]: unknown;
}

export default function SerproPage() {
  const searchParams = useSearchParams();
  const [cnpj, setCnpj] = useState(searchParams.get('cnpj') ?? '');
  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [mes, setMes] = useState('');
  const [numeroRecibo, setNumeroRecibo] = useState('');
  const [codigoReceita, setCodigoReceita] = useState('');
  const [categoria, setCategoria] = useState('GERAL_MENSAL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SerproResponse | null>(null);
  const [error, setError] = useState('');
  const [historyTab, setHistoryTab] = useState<'admin' | 'bot' | 'test'>('admin');
  const [service, setService] = useState<keyof typeof SERVICE_CONFIG>('CCMEI_DADOS');
  const [showYearInfo, setShowYearInfo] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('Consultando...');
  const [sitfisPdfUrl, setSitfisPdfUrl] = useState<string | null>(null);
  const [sitfisProtocolo, setSitfisProtocolo] = useState('');
  const [sitfisTempoEspera, setSitfisTempoEspera] = useState<number | null>(null);

  const buildPdfBlobUrl = (base64: string): string => {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  };

  const SERVICES_WITH_YEAR = ['PGMEI', 'SIMEI', 'DASN_SIMEI', 'PGDASD', 'DCTFWEB', 'PGMEI_EXTRATO', 'PGMEI_BOLETO', 'PARCELAMENTO_MEI_EMITIR', 'PGMEI_ATU_BENEFICIO', 'PGFN_PAEX', 'PGFN_SIPADE'];

  const SERVICE_GROUPS: Record<string, string[]> = {
    "Dados Cadastrais & Enquadramento": ["CCMEI_DADOS", "SIMEI", "PROCURACAO"],
    "Guias e Débitos (PGMEI)": ["PGMEI", "PGMEI_EXTRATO", "PGMEI_BOLETO", "PGMEI_ATU_BENEFICIO"],
    "Situação Fiscal & Certidões": ["SIT_FISCAL_SOLICITAR", "SIT_FISCAL_RELATORIO", "CND"],
    "Declarações (DASN, PGDAS, DCTFWeb)": ["DASN_SIMEI", "PGDASD", "DCTFWEB"],
    "Parcelamentos (MEI & SN)": ["PARCELAMENTO_MEI_CONSULTAR", "PARCELAMENTO_MEI_EMITIR", "PARCELAMENTO_SN_CONSULTAR", "PARCELAMENTO_SN_EMITIR"],
    "Dívida Ativa (PGFN)": ["DIVIDA_ATIVA", "PGFN_CONSULTAR", "PGFN_PAEX", "PGFN_SIPADE"],
    "Mensagens e Processos": ["CAIXA_POSTAL", "PROCESSOS", "PAGAMENTO"]
  };

  // Lógica inteligente para sugestão de ano baseada no serviço
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setNumeroRecibo('');
    setMes('');
    setCodigoReceita('');

    if (service === 'DASN_SIMEI' || service === 'PGDASD') {
      setAno((currentYear - 1).toString());
    } else if (SERVICES_WITH_YEAR.includes(service)) {
      setAno(currentYear.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  useEffect(() => {
    if (service !== 'SIT_FISCAL_SOLICITAR' && service !== 'SIT_FISCAL_RELATORIO') {
      setSitfisProtocolo('');
      setSitfisTempoEspera(null);
      setSitfisPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [service]);

  useEffect(() => {
    return () => {
      if (sitfisPdfUrl) URL.revokeObjectURL(sitfisPdfUrl);
    };
  }, [sitfisPdfUrl]);


  const handleConsultar = async () => {
    if (!cnpj) return;
    if (!validateCnpj(cnpj)) {
      setError('CNPJ inválido. Verifique o número informado.');
      return;
    }

    setLoading(true);
    setLoadingLabel('Consultando...');
    setError('');
    setResult(null);
    setSitfisPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setSitfisProtocolo('');
    setSitfisTempoEspera(null);

    try {
      if (service === 'SIT_FISCAL_SOLICITAR') {
        setLoadingLabel('Solicitando protocolo SITFIS...');
        const { pdfBase64, protocolo, tempoEspera } = await fetchSitfisRelatorio(cnpj);

        setSitfisProtocolo(protocolo);
        setSitfisTempoEspera(tempoEspera);
        setSitfisPdfUrl(buildPdfBlobUrl(pdfBase64));
        setResult({
          flow: {
            tipo: 'SITFIS_2_PASSOS',
            protocoloRelatorio: protocolo,
            tempoEspera,
            pdfBytesEstimado: Math.floor((pdfBase64.length * 3) / 4),
          },
          dados: { pdf: '[base64 ocultado no frontend]' },
        });

        savePdfToR2(pdfBase64, cnpj, protocolo, 'SIT_FISCAL_RELATORIO')
          .catch(() => { /* falha silenciosa — PDF disponível via blob */ });

        return;
      }

      const res = await fetch('/api/serpro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cnpj,
          service,
          ano,
          mes: mes || undefined,
          numeroRecibo: numeroRecibo || undefined,
          protocoloRelatorio: service === 'SIT_FISCAL_RELATORIO' ? (numeroRecibo || undefined) : undefined,
          codigoReceita: codigoReceita || undefined,
          categoria: service === 'DCTFWEB' ? categoria : undefined
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao buscar dados');
      }

      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha inesperada';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-full p-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-400 tracking-tight">Consulta SERPRO</h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1.5">Inteligência Fiscal Automatizada</p>
        </div>
        <div className="w-[300px]">
          <SerproHealthMonitor />
        </div>
      </div>

      <div className="relative bg-white/70 dark:bg-zinc-900/50 backdrop-blur-2xl p-7 rounded-2xl shadow-2xl shadow-purple-500/5 dark:shadow-orange-900/20 border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              CNPJ
            </label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 text-zinc-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 placeholder:text-zinc-400 font-mono text-sm shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Serviço
            </label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value as keyof typeof SERVICE_CONFIG)}
              className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 text-zinc-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 text-sm font-medium shadow-sm cursor-pointer appearance-none"
            >
              {Object.entries(SERVICE_GROUPS).map(([groupName, services]) => (
                <optgroup key={groupName} label={groupName} className="font-semibold text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-900">
                  {services.map(key => {
                    const config = SERVICE_CONFIG[key];
                    if (!config) return null;
                    return (
                      <option key={key} value={key} className="font-normal text-zinc-700 dark:text-zinc-300">
                        {config.descricao ? `${key} - ${config.descricao}` : key}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="bg-gray-100/50 dark:bg-gray-500/10 p-4 rounded-lg border border-gray-100 dark:border-white/10 relative">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {SERVICE_CONFIG[service]?.descricao || 'Serviço Selecionado'}
              </h3>
              {SERVICE_CONFIG[service] && (
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${(SERVICE_CONFIG[service] as ServiceConfigItem).tipo === 'Consultar' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  (SERVICE_CONFIG[service] as ServiceConfigItem).tipo === 'Emitir' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200' :
                    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}>
                  {(SERVICE_CONFIG[service] as ServiceConfigItem).tipo}
                </span>
              )}
            </div>
            <div className="space-y-1 text-sm text-gray-800 dark:text-gray-200">
              <p><span className="font-medium">Finalidade:</span> {(SERVICE_CONFIG[service] as ServiceConfigItem)?.finalidade || 'Não informada'}</p>
              <p><span className="font-medium">Como usar:</span> {(SERVICE_CONFIG[service] as ServiceConfigItem)?.uso || 'Consulte a documentação'}</p>
            </div>
          </div>

          {(['PGMEI', 'SIMEI', 'DASN_SIMEI', 'PGDASD', 'DCTFWEB', 'PGMEI_EXTRATO', 'PGMEI_BOLETO', 'PARCELAMENTO_MEI_EMITIR', 'PGMEI_ATU_BENEFICIO', 'PGFN_PAEX', 'PGFN_SIPADE'].includes(service)) && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                    Ano de Referência
                    <button
                      type="button"
                      onClick={() => setShowYearInfo(!showYearInfo)}
                      className="text-zinc-400 hover:text-blue-500 transition-colors"
                      title="O que é Ano-Calendário?"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                    </button>
                  </label>
                  <input
                    type="number"
                    value={ano}
                    onChange={(e) => setAno(e.target.value)}
                    placeholder="2026"
                    className="w-full p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Mês (Opcional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    placeholder="Ex: 01"
                    className="w-full p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Atalhos de Ano */}
              <div className="flex gap-2">
                {[new Date().getFullYear() - 2, new Date().getFullYear() - 1, new Date().getFullYear()].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setAno(y.toString())}
                    className={`text-xs px-2 py-1 rounded border transition-all ${ano === y.toString()
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 hover:border-zinc-400'
                      }`}
                  >
                    {y}
                  </button>
                ))}
              </div>

              {/* Informações sobre o Ano-Calendário */}
              {(showYearInfo || service === 'DASN_SIMEI') && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex gap-2 text-amber-800 dark:text-amber-300">
                    <svg className="shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                    <div className="text-xs space-y-1">
                      <p className="font-semibold">
                        {service === 'DASN_SIMEI' ? 'Atenção para a DASN (Declaração Anual):' : 'Sobre o Ano-Calendário:'}
                      </p>
                      <p>
                        {service === 'DASN_SIMEI'
                          ? `Em ${new Date().getFullYear()}, você declara os dados do ano que fechou (${new Date().getFullYear() - 1}). Por isso, sugerimos automaticamente ${new Date().getFullYear() - 1}.`
                          : `O Ano-Calendário ${ano} refere-se ao período em que os impostos foram gerados ou as atividades ocorreram.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {service === 'DCTFWEB' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="GERAL_MENSAL">Geral Mensal</option>
                <option value="GERAL_TRIMESTRAL">Geral Trimestral</option>
                <option value="13_SALARIO">13º Salário</option>
                <option value="ESPETACULO_DESPORTIVO">Espetáculo Desportivo</option>
              </select>
            </div>
          )}

          {(service === 'SIT_FISCAL_RELATORIO' || service === 'PGDASD') && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-black/50 rounded-lg">
              <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Número do Recibo / Protocolo (Obrigatório)
              </label>
              <input
                type="text"
                value={numeroRecibo}
                onChange={(e) => setNumeroRecibo(e.target.value)}
                placeholder="Insira o protocolo aqui"
                className="w-full p-2 rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-black/50 outline-none transition-all"
              />
              <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                Este serviço exige o número do recibo ou protocolo da solicitação prévia.
              </p>
            </div>
          )}

          <details className="pt-2">
            <summary className="text-sm font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200">
              Outros Parâmetros (Opcional)
            </summary>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Código da Receita
                </label>
                <input
                  type="text"
                  value={codigoReceita}
                  onChange={(e) => setCodigoReceita(e.target.value)}
                  placeholder="Opcional"
                  className="w-full p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-black/50 outline-none transition-all"
                />
              </div>
            </div>
          </details>

          <button
            onClick={handleConsultar}
            disabled={loading || !cnpj}
            className="w-full py-3.5 px-6 font-bold text-[15px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 dark:from-white dark:to-zinc-200 dark:text-black dark:hover:from-zinc-200 dark:hover:to-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 dark:shadow-white/10 rounded-xl transition-all duration-300 active:scale-[0.98] flex items-center justify-center mt-6"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {loadingLabel}
              </>
            ) : (
              'Executar Consulta Segura'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {sitfisPdfUrl && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                Relatório SITFIS gerado com sucesso
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Protocolo: {sitfisProtocolo} {sitfisTempoEspera ? `• Espera: ${Math.round(sitfisTempoEspera / 1000)}s` : ''}
              </p>
            </div>
            <a
              href={sitfisPdfUrl}
              download={`sitfis-${cnpj.replace(/\D/g, '')}.pdf`}
              className="inline-flex items-center px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
            >
              Baixar PDF
            </a>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
          {([
            { key: 'admin', label: 'Minhas Consultas' },
            { key: 'bot', label: 'Consultas do Bot' },
            { key: 'test', label: 'Consultas de Teste' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setHistoryTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${historyTab === key
                ? key === 'test'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        <LastConsultedClients
          source={historyTab}
          onSelectCnpj={(selectedCnpj) => {
            setCnpj(selectedCnpj);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>

      {result !== null && (
        (() => {
          const rObj = (typeof result === 'object' && result !== null ? result : { mensagem: 'Solicitação processada com sucesso pela Receita Federal, sem dados adicionais retornados.' }) as Record<string, unknown>;
          const mensagens = Array.isArray(rObj.mensagens) ? rObj.mensagens as Array<{ codigo?: string; texto?: string }> : [];
          // Se tiver 'primary', usa ele, senão usa o próprio root.
          const primaryData = rObj.primary ? rObj.primary : rObj;
          const fallbackData = rObj.fallback;

          return (
            <div className="space-y-6">
              {mensagens.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Mensagens do Sistema</h3>
                  <div className="space-y-2">
                    {mensagens.map((m, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-black/50">
                        <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 min-w-[120px]">{m.codigo || 'AVISO'}</div>
                        <div className="text-sm text-black/50 dark:text-blue-200">{m.texto || '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
                <DataViewer data={primaryData} title="Dados da Consulta" />
              </div>

            </div>
          );
        })()
      )}
    </div>
  );
}

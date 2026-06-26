'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  X, Search, FileText, Bot, User, ShieldCheck, ShieldAlert, Calendar,
  AlertTriangle, CheckCircle2, XCircle, RefreshCw, ListTree, LayoutDashboard, Plug, MinusCircle,
} from 'lucide-react';
import { DataViewer } from './DataViewer';
import { PgfnResultCard, hasPgfnResumo } from './PgfnResultCard';
import {
  Consultation, Empresa, ClienteEmpresas, ValidationStatus,
  serviceLabel, validationFromConsultation, latestByService, servicesForEmpresa,
  normalizeService, daysUntil,
} from './consultation-utils';

interface ConsultationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cnpj: string;
  clientName: string;
  onReconsultar?: (cnpj: string) => void;
}

type View = 'resumo' | 'apis' | 'logs';

function formatCnpj(cnpj: string) {
  const d = cnpj.replace(/\D/g, '');
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || cnpj;
}

function formatDate(date: string) {
  try {
    return format(new Date(date), "dd 'de' MMM, HH:mm", { locale: ptBR });
  } catch {
    return '—';
  }
}

function formatDay(date: string | null) {
  if (!date) return '—';
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '—';
  }
}

// ==================== Badges ====================

const VALIDATION_META: Record<ValidationStatus, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  validada: { label: 'Validada', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', Icon: CheckCircle2 },
  sem_procuracao: { label: 'Sem procuração', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', Icon: ShieldAlert },
  erro: { label: 'Erro', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', Icon: XCircle },
  nunca: { label: 'Nunca consultada', cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400', Icon: MinusCircle },
};

function ValidationBadge({ status }: { status: ValidationStatus }) {
  const { label, cls, Icon } = VALIDATION_META[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${cls}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

function SourceTag({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400" title={`Origem: ${source}`}>
      {source === 'bot' ? <Bot className="w-3 h-3" /> : source === 'loop' ? <RefreshCw className="w-3 h-3" /> : <User className="w-3 h-3" />}
      <span className="capitalize">{source}</span>
    </span>
  );
}

// ==================== Empresa navbar ====================

function EmpresaNav({ empresas, selected, onSelect }: {
  empresas: Empresa[]; selected: string; onSelect: (cnpj: string) => void;
}) {
  if (empresas.length <= 1) return null;
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40">
      {empresas.map((e) => {
        const active = e.cnpj === selected;
        return (
          <button
            key={e.cnpj}
            onClick={() => onSelect(e.cnpj)}
            className={`shrink-0 text-left px-3 py-1.5 rounded-lg border transition-colors ${
              active
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <span className="block text-xs font-semibold truncate max-w-[160px]">
              {e.razao_social || 'Empresa'}
            </span>
            <span className="block text-[10px] font-mono opacity-70">{formatCnpj(e.cnpj)}</span>
          </button>
        );
      })}
    </div>
  );
}

// ==================== View tabs ====================

const VIEW_TABS: { id: View; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'resumo', label: 'Resumo', Icon: LayoutDashboard },
  { id: 'apis', label: 'APIs funcionais', Icon: Plug },
  { id: 'logs', label: 'Logs', Icon: ListTree },
];

function ViewTabs({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div className="flex gap-1 px-4 pt-3 border-b border-zinc-200 dark:border-zinc-800">
      {VIEW_TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
            view === id
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          <Icon className="w-4 h-4" /> {label}
        </button>
      ))}
    </div>
  );
}

// ==================== Resumo view ====================

function StatusCard({ title, children, tone = 'default' }: {
  title: string; children: React.ReactNode; tone?: 'default' | 'good' | 'warn' | 'bad';
}) {
  const toneCls = {
    default: 'border-zinc-200 dark:border-zinc-800',
    good: 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/10',
    warn: 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/10',
    bad: 'border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/10',
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${toneCls}`}>
      <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">{title}</p>
      <div className="mt-1.5 text-sm text-zinc-800 dark:text-zinc-200">{children}</div>
    </div>
  );
}

function ResumoView({ cliente, empresa, history, now }: {
  cliente: ClienteEmpresas; empresa: Empresa; history: Consultation[]; now: number;
}) {
  const latest = useMemo(() => latestByService(history), [history]);
  const pgfn = latest.find((c) => normalizeService(c.tipo_servico) === 'PGFN_API');
  const pgfnTemDebito = pgfn && hasPgfnResumo(pgfn.resultado)
    && (pgfn.resultado as { tem_debitos_detectado?: boolean | null }).tem_debitos_detectado === true;
  const certDays = daysUntil(empresa.certificado_validade, now);

  // Procuração: usa nível de empresa quando disponível (cadastro), senão nível do lead
  const procAtiva = empresa.fonte === 'cadastro' && empresa.procuracao_ativa != null
    ? empresa.procuracao_ativa
    : cliente.procuracao_ativa;
  const procValidade = (empresa.fonte === 'cadastro' && empresa.procuracao_validade)
    ? empresa.procuracao_validade
    : cliente.procuracao_validade;
  const procValidadeDays = daysUntil(procValidade ?? null, now);

  return (
    <div className="space-y-5">
      {/* Linha de status principal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatusCard title="Procuração e-CAC" tone={procAtiva ? 'good' : 'warn'}>
          <div className="flex items-center gap-1.5 font-semibold">
            {procAtiva
              ? <><ShieldCheck className="w-4 h-4 text-emerald-500" /> Ativa</>
              : <><ShieldAlert className="w-4 h-4 text-amber-500" /> Sem procuração</>}
          </div>
          {procValidade && (
            <p className="text-xs text-zinc-500 mt-1">
              Validade: {formatDay(procValidade)}
              {procValidadeDays !== null && procValidadeDays <= 30 && (
                <span className="text-amber-500 font-medium"> · {procValidadeDays}d</span>
              )}
            </p>
          )}
        </StatusCard>

        <StatusCard
          title="Certificado A1"
          tone={certDays === null ? 'default' : certDays <= 0 ? 'bad' : certDays <= 30 ? 'warn' : 'good'}
        >
          {empresa.certificado_validade ? (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span className="font-semibold">{formatDay(empresa.certificado_validade)}</span>
              {certDays !== null && (
                <span className={`text-xs ${certDays <= 30 ? 'text-amber-500 font-medium' : 'text-zinc-400'}`}>
                  ({certDays <= 0 ? 'vencido' : `${certDays}d`})
                </span>
              )}
            </div>
          ) : <span className="text-zinc-400">Não cadastrado</span>}
        </StatusCard>

        <StatusCard title="Regime" >
          <span className="font-semibold uppercase">{empresa.regime_tributario || '—'}</span>
          <p className="text-xs text-zinc-500 mt-1">{history.length} consulta(s) registrada(s)</p>
        </StatusCard>
      </div>

      {/* Alerta PGFN */}
      {(pgfnTemDebito || empresa.tem_divida) && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Dívida Ativa (PGFN) detectada
            {pgfn ? ` na consulta de ${formatDate(pgfn.created_at)}` : ''}.
            {empresa.valor_divida_pgfn ? (
              <strong className="ml-1">
                Total: R$ {empresa.valor_divida_pgfn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            ) : null}
          </span>
        </div>
      )}

      {/* Último resultado por serviço */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Último resultado por serviço</h4>
        {latest.length === 0 ? (
          <p className="text-sm text-zinc-400">Nenhuma consulta registrada para esta empresa.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {latest.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{serviceLabel(c.tipo_servico)}</p>
                  <p className="text-xs text-zinc-500">{formatDate(c.created_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <ValidationBadge status={validationFromConsultation(c)} />
                  <SourceTag source={c.source} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== APIs funcionais view ====================

function ApisView({ empresa, history }: { empresa: Empresa; history: Consultation[] }) {
  const latest = useMemo(() => {
    const map = new Map<string, Consultation>();
    for (const c of latestByService(history)) map.set(normalizeService(c.tipo_servico), c);
    return map;
  }, [history]);
  const services = useMemo(() => servicesForEmpresa(empresa, history), [empresa, history]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
        <span>
          Serviços <strong>validados</strong> retornaram com sucesso (procuração aceita pelo e-CAC e CNPJ
          compatível com o serviço). <strong>Sem procuração</strong> indica acesso negado no e-CAC.
        </span>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-zinc-400">Nenhum serviço habilitado ou consultado para esta empresa.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {services.map((svc) => {
            const c = latest.get(svc);
            const status = validationFromConsultation(c);
            const habilitado = (empresa.servicos_habilitados ?? []).map(normalizeService).includes(svc);
            return (
              <div key={svc} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{serviceLabel(svc)}</span>
                    {habilitado && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold uppercase">Habilitado</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {c ? `Última: ${formatDate(c.created_at)}` : 'Nunca consultada'}
                  </p>
                </div>
                <ValidationBadge status={status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== Logs view (master-detail original) ====================

function LogsView({ history, loading }: { history: Consultation[]; loading: boolean }) {
  // Guarda só o id selecionado e resolve na renderização: evita setState-em-effect
  // e lida naturalmente com a troca de empresa (cai no item mais recente).
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = history.find((h) => h.id === selectedId) ?? history[0] ?? null;
  const setSelected = (c: Consultation) => setSelectedId(c.id);

  return (
    <div className="flex-1 flex overflow-hidden min-h-0">
      {/* Lista */}
      <div className="w-1/3 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/50">
        {loading ? (
          <div className="p-4 text-center text-sm text-zinc-500 animate-pulse">Carregando histórico...</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 flex flex-col items-center gap-2">
            <Search className="w-8 h-8 opacity-50" />
            <p>Nenhuma consulta encontrada.</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={`w-full text-left p-4 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col gap-1 ${
                  selected?.id === item.id
                    ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500'
                    : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">{serviceLabel(item.tipo_servico)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                    item.status >= 200 && item.status < 300
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>{item.status}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  <span>{formatDate(item.created_at)}</span>
                  <SourceTag source={item.source} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detalhe */}
      <div className="w-2/3 overflow-y-auto p-6 bg-white dark:bg-zinc-900">
        {selected ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" /> Detalhes da Consulta
              </h3>
              <div className="text-xs text-zinc-500 font-mono">ID: {selected.id}</div>
            </div>
            {hasPgfnResumo(selected.resultado) && <PgfnResultCard data={selected.resultado} />}
            <DataViewer data={selected.resultado} />
            <details>
              <summary className="cursor-pointer text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors mt-4">
                Ver JSON Bruto
              </summary>
              <pre className="mt-2 bg-zinc-100 dark:bg-zinc-950 p-4 rounded overflow-auto text-xs text-zinc-600 dark:text-zinc-400 max-h-[300px] border border-zinc-200 dark:border-zinc-800">
                {JSON.stringify(selected.resultado, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-400">
            <FileText className="w-12 h-12 mb-2 opacity-20" />
            <p>Selecione uma consulta para ver os detalhes</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Modal raiz ====================

export default function ConsultationHistoryModal({
  isOpen, onClose, cnpj, clientName, onReconsultar,
}: ConsultationHistoryModalProps) {
  const [cliente, setCliente] = useState<ClienteEmpresas | null>(null);
  const [selectedCnpj, setSelectedCnpj] = useState(cnpj);
  const [history, setHistory] = useState<Consultation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [view, setView] = useState<View>('resumo');
  const [now] = useState(() => Date.now());

  // Empresas do cliente (navbar)
  const fetchCliente = useCallback(async () => {
    try {
      const res = await fetch(`/api/serpro/cliente-empresas?cnpj=${cnpj.replace(/\D/g, '')}`);
      if (res.status === 401) { window.location.href = '/login'; return; }
      if (res.ok) {
        const data = (await res.json()) as ClienteEmpresas;
        setCliente(data);
        const match = data.empresas.find((e) => e.cnpj === cnpj.replace(/\D/g, ''));
        setSelectedCnpj((match ?? data.empresas[0])?.cnpj ?? cnpj.replace(/\D/g, ''));
      }
    } catch (error) {
      console.error('Error fetching cliente-empresas:', error);
    }
  }, [cnpj]);

  // Histórico da empresa selecionada
  const fetchHistory = useCallback(async (targetCnpj: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/serpro/history?cnpj=${targetCnpj}`);
      if (res.status === 401) { window.location.href = '/login'; return; }
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && cnpj) {
      setView('resumo');
      setSelectedCnpj(cnpj.replace(/\D/g, ''));
      fetchCliente();
    }
  }, [isOpen, cnpj, fetchCliente]);

  useEffect(() => {
    if (isOpen && selectedCnpj) fetchHistory(selectedCnpj);
  }, [isOpen, selectedCnpj, fetchHistory]);

  const selectedEmpresa: Empresa = useMemo(() => {
    const found = cliente?.empresas.find((e) => e.cnpj === selectedCnpj);
    return found ?? {
      id: null, cnpj: selectedCnpj, razao_social: clientName, regime_tributario: null,
      ativo: true, servicos_habilitados: [], certificado_validade: null, fonte: 'fallback',
    };
  }, [cliente, selectedCnpj, clientName]);

  if (!isOpen) return null;

  const clienteData: ClienteEmpresas = cliente ?? {
    lead: null, procuracao_ativa: false, procuracao_validade: null, empresas: [selectedEmpresa],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl h-[85vh] rounded-xl shadow-2xl flex flex-col border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div className="min-w-0">
            <h2 id="history-modal-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {selectedEmpresa.razao_social || clientName}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">{formatCnpj(selectedCnpj)}</p>
          </div>
          <div className="flex items-center gap-2">
            {onReconsultar && (
              <button
                onClick={() => { onReconsultar(selectedCnpj); onClose(); }}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reconsultar
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navbar de empresas */}
        <EmpresaNav empresas={clienteData.empresas} selected={selectedCnpj} onSelect={setSelectedCnpj} />

        {/* Abas de visualização */}
        <ViewTabs view={view} onChange={setView} />

        {/* Conteúdo */}
        {view === 'logs' ? (
          <LogsView history={history} loading={loadingHistory} />
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            {loadingHistory ? (
              <div className="text-center text-sm text-zinc-500 animate-pulse py-10">Carregando...</div>
            ) : view === 'resumo' ? (
              <ResumoView cliente={clienteData} empresa={selectedEmpresa} history={history} now={now} />
            ) : (
              <ApisView empresa={selectedEmpresa} history={history} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

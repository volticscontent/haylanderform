'use client';

import { AlertTriangle, CheckCircle2, FileText, Scale } from 'lucide-react';

type PgfnInscricao = {
  numeroInscricao?: string | null;
  numeroProcesso?: string | null;
  devedorPrincipal?: string | null;
  tipoDevedor?: string | null;
  situacaoDescricao?: string | null;
  tipoRegularidade?: string | null;
  receitaPrincipal?: string | null;
  codigoReceitaPrincipal?: string | null;
  dataInscricao?: string | null;
  valorTotalConsolidado?: number | null;
  valorTotalConsolidadoMoeda?: string | null;
  ajuizada?: boolean | null;
  negociada?: boolean | null;
};

type PgfnResumo = {
  total_inscricoes?: number;
  total_ativas?: number;
  total_ajuizadas?: number;
  total_negociadas?: number;
  valor_total_consolidado?: number;
  valor_total_consolidado_moeda?: string;
  situacoes?: string[];
  regularidades?: string[];
  inscricoes?: PgfnInscricao[];
  resumo_texto?: string;
};

type PgfnPayload = {
  origem?: string;
  consulta?: string;
  parametro?: string;
  tem_debitos_detectado?: boolean | null;
  resumo?: PgfnResumo;
  pgfn_detalhes?: PgfnResumo;
};

const getPgfnResumo = (data: unknown): PgfnResumo | null => {
  if (!data || typeof data !== 'object') return null;
  const obj = data as PgfnPayload;
  const resumo = obj.resumo || obj.pgfn_detalhes;
  if (!resumo || typeof resumo !== 'object') return null;
  if (!Array.isArray(resumo.inscricoes) && typeof resumo.total_inscricoes !== 'number') return null;
  return resumo;
};

export const hasPgfnResumo = (data: unknown): boolean => Boolean(getPgfnResumo(data));

const formatStatus = (value?: boolean | null) => {
  if (value === true) return { label: 'COM DÉBITO', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800' };
  if (value === false) return { label: 'SEM DÉBITO', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
  return { label: 'INCONCLUSIVO', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-4">
    <p className="text-[11px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">{label}</p>
    <p className="mt-1 text-lg font-black text-zinc-900 dark:text-zinc-100">{value}</p>
  </div>
);

export function PgfnResultCard({ data }: { data: unknown }) {
  const resumo = getPgfnResumo(data);
  if (!resumo) return null;

  const obj = data as PgfnPayload;
  const status = formatStatus(obj.tem_debitos_detectado ?? (resumo.total_inscricoes ? true : false));
  const inscricoes = Array.isArray(resumo.inscricoes) ? resumo.inscricoes : [];

  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-zinc-950 p-5 shadow-sm space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Dívida Ativa PGFN</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{resumo.resumo_texto || 'Resumo estruturado da consulta PGFN'}</p>
          </div>
        </div>
        <span className={`shrink-0 px-3 py-1 rounded-full border text-xs font-black ${status.className}`}>{status.label}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Inscrições" value={resumo.total_inscricoes ?? 0} />
        <Stat label="Valor total" value={resumo.valor_total_consolidado_moeda || 'R$ 0,00'} />
        <Stat label="Ajuizadas" value={resumo.total_ajuizadas ?? 0} />
        <Stat label="Negociadas" value={resumo.total_negociadas ?? 0} />
      </div>

      {inscricoes.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
            <FileText className="w-4 h-4" /> Inscrições encontradas
          </div>
          <div className="grid grid-cols-1 gap-3">
            {inscricoes.map((inscricao, index) => (
              <div key={`${inscricao.numeroInscricao || 'inscricao'}-${index}`} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/70 p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">Inscrição</p>
                    <p className="font-mono font-black text-zinc-900 dark:text-zinc-100">{inscricao.numeroInscricao || 'Não informada'}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-[11px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500">Valor</p>
                    <p className="text-xl font-black text-red-700 dark:text-red-300">{inscricao.valorTotalConsolidadoMoeda || 'Não informado'}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">Situação</p>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">{inscricao.situacaoDescricao || 'Não informada'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">Regularidade</p>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">{inscricao.tipoRegularidade || 'Não informada'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">Data inscrição</p>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">{inscricao.dataInscricao || 'Não informada'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4" /> Nenhuma inscrição estruturada retornada pela PGFN.
        </div>
      )}

      {(resumo.situacoes?.length || resumo.regularidades?.length) ? (
        <div className="flex flex-wrap gap-2">
          {resumo.situacoes?.map((situacao) => (
            <span key={situacao} className="text-[11px] px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold">{situacao}</span>
          ))}
          {resumo.regularidades?.map((regularidade) => (
            <span key={regularidade} className="text-[11px] px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold">{regularidade}</span>
          ))}
        </div>
      ) : null}

      {obj.tem_debitos_detectado === null && (
        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4" /> Resultado inconclusivo. Verifique o JSON bruto ou consulte manualmente.
        </div>
      )}
    </div>
  );
}

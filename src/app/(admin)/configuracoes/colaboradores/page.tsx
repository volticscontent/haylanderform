'use client';

import { useEffect, useState, useCallback } from 'react';
import { getColaboradores, createColaborador, updateColaborador, toggleColaboradorAtivo, resetSenha, type Colaborador, type ColaboradorInput } from './actions';
import { Loader2, Plus, X, UserCheck, UserX, Search, Edit2, Save, KeyRound } from 'lucide-react';

const CARGOS_PADRAO = ['Admin', 'Atendente', 'Closer', 'SDR', 'Financeiro', 'Suporte'];
const PERMISSOES_DISPONIVEIS = [
    { id: 'admin', label: 'Administrador' },
    { id: 'atendimento', label: 'Atendimento' },
    { id: 'vendas', label: 'Vendas' },
    { id: 'serpro', label: 'Serpro' },
    //{ id: 'disparo', label: 'Disparos' },
    { id: 'financeiro', label: 'Financeiro' },
];

export default function ColaboradoresPage() {
    const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
    const [filtroCargo, setFiltroCargo] = useState('todos');

    const loadColaboradores = useCallback(async () => {
        const filtro: { cargo?: string; ativo?: boolean } = {};
        if (filtroCargo !== 'todos') filtro.cargo = filtroCargo;
        if (filtroStatus === 'ativos') filtro.ativo = true;
        if (filtroStatus === 'inativos') filtro.ativo = false;

        const res = await getColaboradores(filtro);
        if (res.success && res.data) {
            setColaboradores(res.data);
        } else {
            setMessage({ type: 'error', text: 'Erro ao carregar colaboradores' });
        }
        setLoading(false);
    }, [filtroCargo, filtroStatus]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadColaboradores();
    }, [loadColaboradores]);

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleToggleAtivo = async (id: number) => {
        const res = await toggleColaboradorAtivo(id);
        if (res.success) {
            showMessage('success', res.data?.ativo ? 'Colaborador ativado' : 'Colaborador desativado');
            loadColaboradores();
        } else {
            showMessage('error', res.error || 'Erro');
        }
    };

    const handleOpenEdit = (colab: Colaborador) => {
        setEditingColaborador(colab);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingColaborador(null);
    };

    const handleSaveSuccess = () => {
        handleCloseModal();
        loadColaboradores();
        showMessage('success', editingColaborador ? 'Colaborador atualizado!' : 'Colaborador criado!');
    };

    const filtered = colaboradores.filter(c =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telefone?.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Colaboradores</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Gerencie a equipe e suas permissões de acesso.</p>
                </div>
                <button
                    onClick={() => { setEditingColaborador(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Novo Colaborador
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success'
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <select
                    value={filtroCargo}
                    onChange={(e) => setFiltroCargo(e.target.value)}
                    className="px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                >
                    <option value="todos">Todos os cargos</option>
                    {CARGOS_PADRAO.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value as 'todos' | 'ativos' | 'inativos')}
                    className="px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                >
                    <option value="todos">Todos</option>
                    <option value="ativos">Ativos</option>
                    <option value="inativos">Inativos</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400">
                        <UserX className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">Nenhum colaborador encontrado.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                    <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Nome</th>
                                    <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">Email</th>
                                    <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Telefone</th>
                                    <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Cargo</th>
                                    <th className="text-left px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400 hidden lg:table-cell">Permissões</th>
                                    <th className="text-center px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                                    <th className="text-center px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(colab => (
                                    <tr key={colab.id} className={`border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors ${!colab.ativo ? 'opacity-50' : ''}`}>
                                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{colab.nome}</td>
                                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">{colab.email || '—'}</td>
                                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden md:table-cell">{colab.telefone || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                                                {colab.cargo}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {(colab.permissoes || []).map(p => (
                                                    <span key={p} className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                        {p}
                                                    </span>
                                                ))}
                                                {(!colab.permissoes || colab.permissoes.length === 0) && (
                                                    <span className="text-xs text-zinc-400">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleToggleAtivo(colab.id)}
                                                title={colab.ativo ? 'Desativar' : 'Ativar'}
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-colors ${colab.ativo
                                                    ? 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                                                    : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                                                    }`}
                                            >
                                                {colab.ativo ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                                {colab.ativo ? 'Ativo' : 'Inativo'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleOpenEdit(colab)}
                                                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <p className="text-xs text-zinc-400 text-right">{filtered.length} colaborador{filtered.length !== 1 ? 'es' : ''}</p>

            {/* Modal */}
            {isModalOpen && (
                <ColaboradorModal
                    colaborador={editingColaborador}
                    onClose={handleCloseModal}
                    onSuccess={handleSaveSuccess}
                />
            )}
        </div>
    );
}

function ColaboradorModal({ colaborador, onClose, onSuccess }: {
    colaborador: Colaborador | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const isEditing = !!colaborador;
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resetSenhaOpen, setResetSenhaOpen] = useState(false);
    const [novaSenha, setNovaSenha] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [form, setForm] = useState<ColaboradorInput>({
        nome: colaborador?.nome || '',
        email: colaborador?.email || '',
        telefone: colaborador?.telefone || '',
        cargo: colaborador?.cargo || 'Atendente',
        permissoes: colaborador?.permissoes || [],
        senha: '',
    });

    const handlePermissaoToggle = (permId: string) => {
        setForm(prev => ({
            ...prev,
            permissoes: prev.permissoes?.includes(permId)
                ? prev.permissoes.filter(p => p !== permId)
                : [...(prev.permissoes || []), permId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const payload = { ...form };
        // Não enviar senha vazia no update
        if (isEditing && !payload.senha) {
            delete (payload as Partial<ColaboradorInput>).senha;
        }

        const res = isEditing
            ? await updateColaborador(colaborador!.id, payload)
            : await createColaborador(payload);

        if (res.success) {
            onSuccess();
        } else {
            setError(res.error || 'Erro desconhecido');
        }
        setSaving(false);
    };

    const handleResetSenha = async () => {
        if (!colaborador || !novaSenha) return;
        setResetLoading(true);
        setError(null);
        const res = await resetSenha(colaborador.id, novaSenha);
        if (res.success) {
            setResetSenhaOpen(false);
            setNovaSenha('');
            setError(null);
        } else {
            setError(res.error || 'Erro ao redefinir senha');
        }
        setResetLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-5">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {isEditing ? 'Editar Colaborador' : 'Novo Colaborador'}
                    </h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nome *</label>
                        <input
                            type="text"
                            required
                            value={form.nome}
                            onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
                            placeholder="Nome completo"
                            className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email *</label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="email@empresa.com"
                                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Telefone</label>
                            <input
                                type="text"
                                value={form.telefone}
                                onChange={(e) => setForm(prev => ({ ...prev, telefone: e.target.value }))}
                                placeholder="11999999999"
                                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Cargo *</label>
                        <select
                            required
                            value={form.cargo}
                            onChange={(e) => setForm(prev => ({ ...prev, cargo: e.target.value }))}
                            className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            {CARGOS_PADRAO.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Permissões</label>
                        <div className="flex flex-wrap gap-2">
                            {PERMISSOES_DISPONIVEIS.map(perm => {
                                const checked = form.permissoes?.includes(perm.id);
                                return (
                                    <label
                                        key={perm.id}
                                        className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium border transition-all select-none ${checked
                                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                            : 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={checked}
                                            onChange={() => handlePermissaoToggle(perm.id)}
                                        />
                                        {perm.label}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Senha */}
                    {!isEditing && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Senha de acesso *</label>
                            <input
                                type="password"
                                required={!isEditing}
                                value={form.senha || ''}
                                onChange={(e) => setForm(prev => ({ ...prev, senha: e.target.value }))}
                                placeholder="Senha para login"
                                minLength={4}
                                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    )}

                    {/* Redefinir Senha (apenas edição) */}
                    {isEditing && (
                        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                            {!resetSenhaOpen ? (
                                <button
                                    type="button"
                                    onClick={() => setResetSenhaOpen(true)}
                                    className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:underline"
                                >
                                    <KeyRound className="w-4 h-4" />
                                    Redefinir senha
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value={novaSenha}
                                        onChange={(e) => setNovaSenha(e.target.value)}
                                        placeholder="Nova senha (min 4 chars)"
                                        minLength={4}
                                        className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleResetSenha}
                                        disabled={resetLoading || novaSenha.length < 4}
                                        className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                    >
                                        {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setResetSenhaOpen(false); setNovaSenha(''); }}
                                        className="p-2 text-zinc-400 hover:text-zinc-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isEditing ? 'Salvar' : 'Criar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

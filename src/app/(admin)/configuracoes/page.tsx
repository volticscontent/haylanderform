'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getSystemSettings, updateSystemSetting, updateSettingBots, createSystemSetting, deleteSystemSetting, getSettingFileContent, updateSettingFileContent, getUploadUrl, type SystemSetting } from './actions';
import { Upload, File as FileIcon, Loader2, CheckCircle2, Plus, Trash2, X, Edit2, Save, Link, ExternalLink, Copy, Check } from 'lucide-react';

const AVAILABLE_BOTS = [
    { id: 'apolo', label: 'Apolo (SDR)' },
    { id: 'icaro', label: 'Icaro (Closer)' },
    { id: 'atendente', label: 'Atendente (Suporte)' }
];

const SUGGESTED_SETTINGS: Array<{
    key: string;
    label: string;
    type: 'link' | 'text' | 'media';
    defaultValue: string;
    description: string;
    usedBy: string;
}> = [
    {
        key: 'link_ecac_tutorial',
        label: 'Tutorial e-CAC (Instagram)',
        type: 'link',
        defaultValue: 'https://www.instagram.com/reel/DWquc43Cdnm/?igsh=OXlzc2ZzNDVvaHU5',
        description: 'Link do reel/vídeo ensinando o cliente a fazer a Procuração no e-CAC. Enviado automaticamente pelo Apolo.',
        usedBy: 'Apolo (fluxo de regularização)',
    },
    {
        key: 'link_reuniao',
        label: 'Link de Reunião (Calendly/Google Meet)',
        type: 'link',
        defaultValue: '',
        description: 'Link enviado pelo bot para MQLs agendarem reunião de fechamento.',
        usedBy: 'Apolo (workflow comercial)',
    },
    {
        key: 'apresentacao_comercial',
        label: 'Apresentação Comercial (PDF)',
        type: 'media',
        defaultValue: '',
        description: 'PDF enviado pelo bot durante a qualificação. Faça upload na seção Materiais de Mídia abaixo.',
        usedBy: 'Apolo (qualificação)',
    },
];

export default function ConfiguracoesPage() {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editorOpen, setEditorOpen] = useState(false);
    const [currentEditingFile, setCurrentEditingFile] = useState<{ key: string, label: string } | null>(null);

    const loadSettings = useCallback(async () => {
        const res = await getSystemSettings();
        if (res.success && res.data) {
            setSettings(res.data);
        } else {
            setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
        }
        setLoading(false);
    }, []);

    const handleDelete = async (key: string) => {
        if (!confirm('Tem certeza que deseja excluir esta configuração?')) return;

        const res = await deleteSystemSetting(key);
        if (res.success) {
            setMessage({ type: 'success', text: 'Configuração excluída' });
            loadSettings();
        } else {
            setMessage({ type: 'error', text: 'Erro ao excluir configuração' });
        }
    };

    useEffect(() => {
        let mounted = true;
        const init = async () => {
            try {
                const res = await getSystemSettings();
                if (mounted) {
                    if (res.success && res.data) {
                        setSettings(res.data);
                    } else {
                        setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
                    }
                    setLoading(false);
                }
            } catch {
                if (mounted) {
                    setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
                    setLoading(false);
                }
            }
        };
        init();
        return () => { mounted = false; };
    }, []);

    const handleBotChange = async (key: string, botId: string, checked: boolean) => {
        const setting = settings.find(s => s.key === key);
        if (!setting) return;

        const currentBots = setting.allowed_bots || [];
        const newBots = checked
            ? [...currentBots, botId]
            : currentBots.filter(b => b !== botId);

        // Optimistic update
        setSettings(prev => prev.map(s => s.key === key ? { ...s, allowed_bots: newBots } : s));

        const res = await updateSettingBots(key, newBots);
        if (!res.success) {
            setMessage({ type: 'error', text: 'Erro ao atualizar permissões do bot' });
            // Rollback
            setSettings(prev => prev.map(s => s.key === key ? { ...s, allowed_bots: currentBots } : s));
        }
    };

    const handleValueChange = async (key: string, newValue: string) => {
        // Optimistic
        const previousValue = settings.find(s => s.key === key)?.value;
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));

        const res = await updateSystemSetting(key, newValue);
        if (res.success) {
            setMessage({ type: 'success', text: 'Configuração atualizada' });
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: 'Erro ao salvar configuração' });
            // Rollback
            if (previousValue !== undefined) {
                setSettings(prev => prev.map(s => s.key === key ? { ...s, value: previousValue } : s));
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
        );
    }

    const mediaSettings = settings.filter(s => s.type === 'media');
    const paramSettings = settings.filter(s => s.type !== 'media');
    const configuredKeys = new Set(settings.map(s => s.key));
    const missingSuggested = SUGGESTED_SETTINGS.filter(s => !configuredKeys.has(s.key));

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Configurações do Sistema</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Gerencie materiais de mídia, links e parâmetros globais dos bots.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nova Configuração
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                    {message.text}
                </div>
            )}

            {/* Suggested Settings */}
            {missingSuggested.length > 0 && (
                <SuggestedSettingsPanel
                    missing={missingSuggested}
                    onCreated={loadSettings}
                    onMessage={setMessage}
                />
            )}

            {/* Params & Links Section */}
            {paramSettings.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        Parâmetros e Links
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paramSettings.map(setting => (
                            <ParamCard
                                key={setting.key}
                                setting={setting}
                                onValueChange={handleValueChange}
                                onBotChange={handleBotChange}
                                onDelete={() => handleDelete(setting.key)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Media Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    Materiais de Mídia
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mediaSettings.map(setting => (
                        <MediaCard
                            key={setting.key}
                            setting={setting}
                            onUpdate={loadSettings}
                            onBotChange={handleBotChange}
                            onDelete={() => handleDelete(setting.key)}
                            onEdit={() => {
                                setCurrentEditingFile({ key: setting.key, label: setting.label });
                                setEditorOpen(true);
                            }}
                        />
                    ))}
                </div>
            </section>

            <NewSettingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    loadSettings();
                    setMessage({ type: 'success', text: 'Configuração criada com sucesso!' });
                }}
            />

            {editorOpen && currentEditingFile && (
                <FileEditorModal
                    isOpen={editorOpen}
                    onClose={() => setEditorOpen(false)}
                    fileKey={currentEditingFile.key}
                    fileLabel={currentEditingFile.label}
                />
            )}
        </div>
    );
}

function MediaCard({ setting, onUpdate, onBotChange, onDelete, onEdit }: { setting: SystemSetting, onUpdate: () => void, onBotChange: (k: string, b: string, c: boolean) => void, onDelete: () => void, onEdit: () => void }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // 1. Get Presigned URL
            const urlRes = await getUploadUrl(setting.key, file.name, file.type);

            if (!urlRes.success || !urlRes.uploadUrl || !urlRes.publicUrl) {
                throw new Error('Falha ao obter URL de upload');
            }

            // 2. Upload directly to R2
            const uploadRes = await fetch(urlRes.uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type
                }
            });

            if (!uploadRes.ok) {
                throw new Error('Falha no upload para o servidor de arquivos');
            }

            // 3. Update database with public URL
            const updateRes = await updateSystemSetting(setting.key, urlRes.publicUrl);

            if (updateRes.success) {
                onUpdate();
            } else {
                throw new Error('Falha ao salvar URL no banco de dados');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao fazer upload do arquivo. Tente novamente.');
        } finally {
            setUploading(false);
        }
    };

    const isExternalUrl = setting.value && /^https?:\/\//.test(setting.value) && !setting.value.match(/\.(jpg|jpeg|png|webp|gif|mp4|webm|mov|mp3|ogg|wav|pdf)$/i);
    const isImage = !isExternalUrl && setting.value?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
    const isVideo = !isExternalUrl && setting.value?.match(/\.(mp4|webm|mov)$/i);
    const isAudio = !isExternalUrl && setting.value?.match(/\.(mp3|ogg|wav)$/i);
    const isPdf = !isExternalUrl && setting.value?.match(/\.pdf$/i);
    const isTextFile = !isExternalUrl && !isImage && !isVideo && !isAudio && !isPdf && setting.value;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col group">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="font-medium text-sm text-black dark:text-white">{setting.label}</span>
                <div className="flex items-center gap-1">
                    {isTextFile && (
                        <button
                            onClick={onEdit}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500"
                            title="Editar conteúdo"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500"
                        title="Alterar arquivo"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 rounded-lg transition-colors"
                        title="Excluir"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleUpload}
                />
            </div>

            <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center min-h-[200px] p-4">
                {setting.value ? (
                    <>
                        {isImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={setting.value} alt={setting.label} className="max-h-[200px] object-contain rounded-lg shadow-sm" />
                        )}
                        {isVideo && (
                            <video src={setting.value} controls className="max-h-[200px] rounded-lg shadow-sm" />
                        )}
                        {isAudio && (
                            <audio src={setting.value} controls className="w-full" />
                        )}
                        {isExternalUrl && (
                            <div className="flex flex-col items-center gap-3 text-center px-4">
                                <Link className="w-10 h-10 text-purple-400 dark:text-orange-400 opacity-70" />
                                <span className="text-xs text-zinc-500 break-all">{setting.value}</span>
                                <a href={setting.value} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400">
                                    <ExternalLink className="w-3 h-3" /> Abrir link
                                </a>
                            </div>
                        )}
                        {!isExternalUrl && !isImage && !isVideo && !isAudio && (
                            <div className="text-center text-zinc-500">
                                <FileIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <span className="text-xs break-all px-4">{setting.value.split('/').pop()}</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-zinc-400">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <span className="text-xs">Nenhum arquivo</span>
                    </div>
                )}
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                {setting.value && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded border border-zinc-100 dark:border-zinc-800">
                        <FileIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate" title={setting.value.split('/').pop()}>
                            {setting.value.split('/').pop()}
                        </span>
                    </div>
                )}
                <BotSelector setting={setting} onBotChange={onBotChange} />
            </div>
        </div>
    );
}

function SuggestedSettingsPanel({ missing, onCreated, onMessage }: {
    missing: typeof SUGGESTED_SETTINGS;
    onCreated: () => void;
    onMessage: (m: { type: 'success' | 'error'; text: string }) => void;
}) {
    const [creating, setCreating] = useState<string | null>(null);

    const handleCreate = async (item: typeof SUGGESTED_SETTINGS[0]) => {
        setCreating(item.key);
        const res = await createSystemSetting({
            key: item.key,
            label: item.label,
            type: item.type,
            value: item.defaultValue,
        });
        if (res.success) {
            onMessage({ type: 'success', text: `"${item.label}" criada${item.defaultValue ? ' com valor padrão' : ' — configure o valor abaixo'}` });
            onCreated();
        } else {
            onMessage({ type: 'error', text: `Erro ao criar "${item.label}"` });
        }
        setCreating(null);
    };

    return (
        <section className="space-y-3">
            <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    Configurações Importantes Faltando
                </h2>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                    {missing.length} pendente{missing.length > 1 ? 's' : ''}
                </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {missing.map(item => (
                    <div
                        key={item.key}
                        className="bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 space-y-3"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{item.label}</p>
                                <p className="text-[10px] font-mono text-amber-600 dark:text-amber-500 mt-0.5">{item.key}</p>
                            </div>
                            <span className="text-[10px] font-semibold uppercase bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded flex-shrink-0">
                                {item.type}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">{item.description}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Usado por: {item.usedBy}</p>
                        <button
                            onClick={() => handleCreate(item)}
                            disabled={creating === item.key}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {creating === item.key ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Criando...</>
                            ) : (
                                <><Plus className="w-3 h-3" /> {item.defaultValue ? 'Criar com valor padrão' : 'Criar'}</>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ParamCard({ setting, onValueChange, onBotChange, onDelete }: {
    setting: SystemSetting,
    onValueChange: (key: string, value: string) => void,
    onBotChange: (k: string, b: string, c: boolean) => void,
    onDelete: () => void
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(setting.value || '');
    const [copied, setCopied] = useState(false);

    const isLink = setting.type === 'link';
    const isUrl = isLink || (setting.value && /^https?:\/\//.test(setting.value));

    const handleSave = () => {
        onValueChange(setting.key, draft);
        setEditing(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(setting.value || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-2 min-w-0">
                    {isLink ? <Link className="w-4 h-4 text-purple-500 dark:text-orange-400 flex-shrink-0" /> : <FileIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />}
                    <span className="font-medium text-sm text-black dark:text-white truncate">{setting.label}</span>
                    <span className="text-[10px] text-zinc-400 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded flex-shrink-0">{setting.key}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {!editing && (
                        <button onClick={() => { setDraft(setting.value || ''); setEditing(true); }} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500" title="Editar">
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                    <button onClick={onDelete} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 rounded-lg transition-colors" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 p-4 space-y-3">
                {editing ? (
                    <div className="space-y-2">
                        {setting.type === 'textarea' ? (
                            <textarea
                                value={draft}
                                onChange={e => setDraft(e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-orange-500"
                                autoFocus
                            />
                        ) : (
                            <input
                                type="text"
                                value={draft}
                                onChange={e => setDraft(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-orange-500"
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                            />
                        )}
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-lg transition-colors">Cancelar</button>
                            <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-purple-600 hover:bg-purple-700 dark:bg-orange-500 dark:hover:bg-orange-600 rounded-lg transition-colors">
                                <Save className="w-3 h-3" /> Salvar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        {setting.value ? (
                            isUrl ? (
                                <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-lg group/link">
                                    <Link className="w-3.5 h-3.5 text-purple-400 dark:text-orange-400 flex-shrink-0" />
                                    <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate flex-1 font-mono" title={setting.value}>{setting.value}</span>
                                    <div className="flex gap-1 opacity-0 group-hover/link:opacity-100 transition-opacity">
                                        <button onClick={handleCopy} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors" title="Copiar">
                                            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                                        </button>
                                        <a href={setting.value} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors" title="Abrir link">
                                            <ExternalLink className="w-3 h-3 text-zinc-400" />
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 break-words whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                    {setting.value}
                                </p>
                            )
                        ) : (
                            <p className="text-xs text-zinc-400 italic">Nenhum valor configurado</p>
                        )}
                    </div>
                )}

                <BotSelector setting={setting} onBotChange={onBotChange} />
            </div>
        </div>
    );
}

function BotSelector({ setting, onBotChange }: { setting: SystemSetting, onBotChange: (k: string, b: string, c: boolean) => void }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Disponível para</label>
            <div className="flex flex-wrap gap-2">
                {AVAILABLE_BOTS.map(bot => {
                    const checked = setting.allowed_bots === null || setting.allowed_bots.includes(bot.id);

                    return (
                        <label
                            key={bot.id}
                            className={`
                                cursor-pointer px-2 py-1 rounded-md text-[10px] font-medium border transition-all select-none flex items-center gap-1.5
                                ${checked
                                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
                                    : 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                }
                            `}
                        >
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={checked}
                                onChange={(e) => onBotChange(setting.key, bot.id, e.target.checked)}
                            />
                            {checked && <CheckCircle2 className="w-3 h-3" />}
                            {bot.label}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}

function FileEditorModal({ isOpen, onClose, fileKey, fileLabel }: { isOpen: boolean, onClose: () => void, fileKey: string, fileLabel: string }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && fileKey) {
            getSettingFileContent(fileKey).then(res => {
                if (res.success && res.content) {
                    setContent(res.content);
                    setError(null);
                } else {
                    setError('Não foi possível carregar o conteúdo do arquivo. Verifique se ele existe e se é um arquivo de texto válido.');
                }
                setLoading(false);
            });
        }
    }, [isOpen, fileKey]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        // Tentar detectar extensão original ou usar txt
        let ext = 'txt';
        if (fileLabel.toLowerCase().includes('json')) ext = 'json';
        if (fileLabel.toLowerCase().includes('md')) ext = 'md';
        if (fileLabel.toLowerCase().includes('prompt')) ext = 'md';

        try {
            // Basic validation for JSON
            if (ext === 'json') {
                JSON.parse(content);
            }
        } catch {
            setError('O conteúdo não é um JSON válido. Corrija antes de salvar.');
            setSaving(false);
            return;
        }

        const res = await updateSettingFileContent(fileKey, content, ext);
        if (res.success) {
            onClose();
        } else {
            setError('Erro ao salvar alterações no arquivo. Tente novamente.');
        }
        setSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-4xl p-6 space-y-4 h-[80vh] flex flex-col">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <Edit2 className="w-4 h-4 text-purple-500 dark:text-orange-500" />
                            Editando: {fileLabel}
                        </h2>
                        <p className="text-xs text-zinc-500">Faça alterações no conteúdo do arquivo diretamente.</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                        <X className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-zinc-500">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-sm">Carregando conteúdo...</span>
                    </div>
                ) : (
                    <div className="flex-1 relative group">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="absolute inset-0 w-full h-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-orange-500 transition-all leading-relaxed"
                            spellCheck={false}
                        />
                    </div>
                )}

                <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-zinc-400">
                        {content.length} caracteres
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-lg transition-colors text-sm font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NewSettingModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('text');
    const [key, setKey] = useState('');
    const [label, setLabel] = useState('');
    const [value, setValue] = useState('');
    const [file, setFile] = useState<File | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await createSystemSetting({ key, label, type, value: type === 'media' ? '' : value });

        if (res.success) {
            if (type === 'media' && file) {
                try {
                    // 1. Get Presigned URL
                    const urlRes = await getUploadUrl(key, file.name, file.type);

                    if (!urlRes.success || !urlRes.uploadUrl || !urlRes.publicUrl) {
                        throw new Error('Falha ao obter URL de upload');
                    }

                    // 2. Upload directly to R2
                    const uploadRes = await fetch(urlRes.uploadUrl, {
                        method: 'PUT',
                        body: file,
                        headers: {
                            'Content-Type': file.type
                        }
                    });

                    if (!uploadRes.ok) {
                        throw new Error('Falha no upload para o servidor de arquivos');
                    }

                    // 3. Update database with public URL
                    const updateRes = await updateSystemSetting(key, urlRes.publicUrl);

                    if (!updateRes.success) {
                        throw new Error('Falha ao salvar URL no banco de dados');
                    }
                } catch (err) {
                    console.error(err);
                    alert('Configuração criada, mas erro ao fazer upload do arquivo via URL assinada.');
                }
            }

            onSuccess();
            onClose();
            // Reset form
            setKey('');
            setLabel('');
            setValue('');
            setType('text');
            setFile(null);
        } else {
            alert('Erro ao criar configuração');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Nova Configuração</h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tipo</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                        >
                            <option value="text">Texto Curto</option>
                            <option value="textarea">Texto Longo</option>
                            <option value="link">Link / URL</option>
                            <option value="media">Mídia (Arquivo)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Chave (Key)</label>
                        <input
                            type="text"
                            required
                            value={key}
                            onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                            placeholder="ex: video_institucional"
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-mono"
                            list="default-keys"
                        />
                        <datalist id="default-keys">
                            <option value="apresentacao_comercial" />
                            <option value="video_ecac" />
                            <option value="link_ecac_tutorial" />
                            <option value="link_reuniao" />
                            <option value="prompt_vendedor" />
                            <option value="prompt_apolo" />
                            <option value="prompt_atendente" />
                        </datalist>
                        <p className="text-xs text-zinc-500 mt-1">Identificador único usado pelo bot. Sugestões aparecem ao digitar.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Rótulo (Label)</label>
                        <input
                            type="text"
                            required
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="ex: Vídeo Institucional"
                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                        />
                    </div>

                    {type !== 'media' && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Valor Inicial</label>
                            {type === 'textarea' ? (
                                <textarea
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                                    rows={3}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                                />
                            )}
                        </div>
                    )}

                    {type === 'media' && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Arquivo</label>
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-orange-900/20 dark:file:text-orange-400"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-orange-500 dark:hover:bg-orange-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Criar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

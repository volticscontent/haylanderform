'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getSystemSettings, updateSystemSetting, uploadSystemSettingFile, updateSettingBots, createSystemSetting, deleteSystemSetting, type SystemSetting } from './actions';
import { Upload, File as FileIcon, Loader2, CheckCircle2, Plus, Trash2, X } from 'lucide-react';

const AVAILABLE_BOTS = [
    { id: 'apolo', label: 'Apolo (SDR)' },
    { id: 'icaro', label: 'Icaro (Closer)' },
    { id: 'atendente', label: 'Atendente (Suporte)' }
];

export default function ConfiguracoesPage() {
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Configurações do Sistema</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">Gerencie materiais de mídia e parâmetros globais dos bots.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
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
                        />
                    ))}
                </div>
            </section>

            {/* Parameters Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    Parâmetros Gerais
                </h2>
                <div className="space-y-4">
                    {paramSettings.map(setting => (
                        <div key={setting.key} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                            <div className="flex justify-between items-start">
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    {setting.label}
                                </label>
                                <div className="flex items-center gap-4">
                                    <BotSelector setting={setting} onBotChange={handleBotChange} />
                                    <button 
                                        onClick={() => handleDelete(setting.key)}
                                        className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                                        title="Excluir configuração"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            {setting.type === 'textarea' ? (
                                <textarea
                                    value={setting.value || ''}
                                    onChange={(e) => setSettings(prev => prev.map(s => s.key === setting.key ? { ...s, value: e.target.value } : s))}
                                    onBlur={(e) => handleValueChange(setting.key, e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    rows={4}
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={setting.value || ''}
                                    onChange={(e) => setSettings(prev => prev.map(s => s.key === setting.key ? { ...s, value: e.target.value } : s))}
                                    onBlur={(e) => handleValueChange(setting.key, e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            )}
                        </div>
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
        </div>
    );
}

function MediaCard({ setting, onUpdate, onBotChange, onDelete }: { setting: SystemSetting, onUpdate: () => void, onBotChange: (k: string, b: string, c: boolean) => void, onDelete: () => void }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('key', setting.key);
        formData.append('file', file);

        const res = await uploadSystemSettingFile(formData);
        if (res.success) {
            onUpdate();
        } else {
            alert('Erro no upload');
        }
        setUploading(false);
    };

    const isImage = setting.value?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
    const isVideo = setting.value?.match(/\.(mp4|webm|mov)$/i);
    const isAudio = setting.value?.match(/\.(mp3|ogg|wav)$/i);

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col group">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="font-medium text-sm text-zinc-700 dark:text-zinc-200">{setting.label}</span>
                <div className="flex items-center gap-1">
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
                        {!isImage && !isVideo && !isAudio && (
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

            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
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
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' 
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

function NewSettingModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('text');
    const [key, setKey] = useState('');
    const [label, setLabel] = useState('');
    const [value, setValue] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await createSystemSetting({ key, label, type, value });
        
        if (res.success) {
            onSuccess();
            onClose();
            // Reset form
            setKey('');
            setLabel('');
            setValue('');
            setType('text');
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
                        />
                        <p className="text-xs text-zinc-500 mt-1">Identificador único usado pelo bot.</p>
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
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
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

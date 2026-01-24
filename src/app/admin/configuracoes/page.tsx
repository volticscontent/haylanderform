"use client";

import { useEffect, useState, useRef } from "react";
import {
  getSystemSettings,
  updateSystemSetting,
  uploadSystemSettingFile,
  updateSettingBots,
  type SystemSetting,
} from "./actions";
import {
  Upload,
  File as FileIcon,
  Check,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const AVAILABLE_BOTS = [
  { id: "apolo", label: "Apolo (SDR)" },
  { id: "icaro", label: "Icaro (Closer)" },
  { id: "atendente", label: "Atendente (Suporte)" },
];

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const res = await getSystemSettings();
    if (res.success && res.data) {
      setSettings(res.data);
    } else {
      setMessage({ type: "error", text: "Erro ao carregar configurações" });
    }
    setLoading(false);
  };

  const handleBotChange = async (
    key: string,
    botId: string,
    checked: boolean,
  ) => {
    const setting = settings.find((s) => s.key === key);
    if (!setting) return;

    const currentBots = setting.allowed_bots || [];
    const newBots = checked
      ? [...currentBots, botId]
      : currentBots.filter((b) => b !== botId);

    // Optimistic update
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, allowed_bots: newBots } : s)),
    );

    const res = await updateSettingBots(key, newBots);
    if (!res.success) {
      setMessage({
        type: "error",
        text: "Erro ao atualizar permissões do bot",
      });
      // Rollback
      setSettings((prev) =>
        prev.map((s) =>
          s.key === key ? { ...s, allowed_bots: currentBots } : s,
        ),
      );
    }
  };

  const handleValueChange = async (key: string, newValue: string) => {
    // Optimistic
    const previousValue = settings.find((s) => s.key === key)?.value;
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value: newValue } : s)),
    );

    const res = await updateSystemSetting(key, newValue);
    if (res.success) {
      setMessage({ type: "success", text: "Configuração atualizada" });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: "error", text: "Erro ao salvar configuração" });
      // Rollback
      if (previousValue !== undefined) {
        setSettings((prev) =>
          prev.map((s) => (s.key === key ? { ...s, value: previousValue } : s)),
        );
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

  const mediaSettings = settings.filter((s) => s.type === "media");
  const paramSettings = settings.filter((s) => s.type !== "media");

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Configurações do Sistema
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Gerencie materiais de mídia e parâmetros globais dos bots.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}
        >
          {message.text}
        </div>
      )}

      {/* Media Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          Materiais de Mídia
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mediaSettings.map((setting) => (
            <MediaCard
              key={setting.key}
              setting={setting}
              onUpdate={loadSettings}
              onBotChange={handleBotChange}
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
          {paramSettings.map((setting) => (
            <div
              key={setting.key}
              className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3"
            >
              <div className="flex justify-between items-start">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {setting.label}
                </label>
                <BotSelector setting={setting} onBotChange={handleBotChange} />
              </div>
              {setting.type === "textarea" ? (
                <textarea
                  value={setting.value || ""}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev.map((s) =>
                        s.key === setting.key
                          ? { ...s, value: e.target.value }
                          : s,
                      ),
                    )
                  }
                  onBlur={(e) => handleValueChange(setting.key, e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  rows={4}
                />
              ) : (
                <input
                  type="text"
                  value={setting.value || ""}
                  onChange={(e) =>
                    setSettings((prev) =>
                      prev.map((s) =>
                        s.key === setting.key
                          ? { ...s, value: e.target.value }
                          : s,
                      ),
                    )
                  }
                  onBlur={(e) => handleValueChange(setting.key, e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MediaCard({
  setting,
  onUpdate,
  onBotChange,
}: {
  setting: SystemSetting;
  onUpdate: () => void;
  onBotChange: (k: string, b: string, c: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("key", setting.key);
    formData.append("file", file);

    const res = await uploadSystemSettingFile(formData);
    if (res.success) {
      onUpdate();
    } else {
      alert("Erro no upload");
    }
    setUploading(false);
  };

  const isImage = setting.value?.match(/\.(jpg|jpeg|png|webp|gif)$/i);
  const isVideo = setting.value?.match(/\.(mp4|webm|mov)$/i);
  const isAudio = setting.value?.match(/\.(mp3|ogg|wav)$/i);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
        <span className="font-medium text-sm text-zinc-700 dark:text-zinc-200">
          {setting.label}
        </span>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500"
          title="Alterar arquivo"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </button>
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
              <img
                src={setting.value}
                alt={setting.label}
                className="max-h-[200px] object-contain rounded-lg shadow-sm"
              />
            )}
            {isVideo && (
              <video
                src={setting.value}
                controls
                className="max-h-[200px] rounded-lg shadow-sm"
              />
            )}
            {isAudio && (
              <audio src={setting.value} controls className="w-full" />
            )}
            {!isImage && !isVideo && !isAudio && (
              <div className="text-center text-zinc-500">
                <FileIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <span className="text-xs break-all px-4">
                  {setting.value.split("/").pop()}
                </span>
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

function BotSelector({
  setting,
  onBotChange,
}: {
  setting: SystemSetting;
  onBotChange: (k: string, b: string, c: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
        Disponível para
      </label>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_BOTS.map((bot) => {
          const checked =
            setting.allowed_bots === null ||
            setting.allowed_bots.includes(bot.id);

          return (
            <label
              key={bot.id}
              className={`
                                cursor-pointer px-2 py-1 rounded-md text-[10px] font-medium border transition-all select-none flex items-center gap-1.5
                                ${
                                  checked
                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                                    : "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                }
                            `}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={checked}
                onChange={(e) =>
                  onBotChange(setting.key, bot.id, e.target.checked)
                }
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

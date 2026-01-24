"use client";

import { useEffect, useState } from "react";

type Service = {
  id: string;
  name: string;
  value: number;
  description: string | null;
  created_at?: string;
  updated_at?: string;
};

function formatCurrencyBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ServicoPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/services", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Falha ao carregar");
      setItems(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro inesperado";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setValue("");
    setDescription("");
  };

  const openCreate = () => {
    resetForm();
    setIsOpen(true);
  };

  const openEdit = (svc: Service) => {
    setEditing(svc);
    setName(svc.name);
    setValue(String(svc.value));
    setDescription(svc.description || "");
    setIsOpen(true);
  };

  const save = async () => {
    if (!name || !value) return;
    const payload = { name, value: Number(value), description };
    setLoading(true);
    setError("");
    try {
      if (editing) {
        const res = await fetch(`/api/services/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Falha ao atualizar");
      } else {
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Falha ao criar");
      }
      setIsOpen(false);
      resetForm();
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro inesperado";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (svc: Service) => {
    if (!confirm("Excluir este serviço?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/services/${svc.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(
          (data as { error?: string })?.error || "Falha ao excluir",
        );
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro inesperado";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 h-full p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Gestão de Serviços
        </h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
        >
          Adicionar Serviço
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-600 dark:text-zinc-400">
                <th className="py-2 px-3">Nome</th>
                <th className="py-2 px-3">Valor</th>
                <th className="py-2 px-3">Descrição</th>
                <th className="py-2 px-3 w-40">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((svc) => (
                <tr
                  key={svc.id}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="py-2 px-3 text-zinc-900 dark:text-white">
                    {svc.name}
                  </td>
                  <td className="py-2 px-3 text-zinc-900 dark:text-white">
                    {formatCurrencyBRL(Number(svc.value))}
                  </td>
                  <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300">
                    {svc.description || "-"}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(svc)}
                        className="px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => remove(svc)}
                        className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr>
                  <td
                    className="py-6 px-3 text-zinc-500 dark:text-zinc-400"
                    colSpan={4}
                  >
                    Nenhum serviço cadastrado.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    className="py-6 px-3 text-zinc-500 dark:text-zinc-400"
                    colSpan={4}
                  >
                    Carregando...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editing ? "Editar Serviço" : "Adicionar Serviço"}
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading || !name || !value}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

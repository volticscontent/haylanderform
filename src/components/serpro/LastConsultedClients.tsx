'use client'

import { useEffect, useState } from 'react'
import { SerproClient } from '@/types/client'
import ClientCard from './ClientCard'

interface LastConsultedClientsProps {
  source?: 'admin' | 'bot' | 'test';
  onSelectCnpj?: (cnpj: string) => void;
}

export default function LastConsultedClients({ source, onSelectCnpj }: LastConsultedClientsProps) {
  const [clients, setClients] = useState<SerproClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(false)
      const url = source ? `/api/serpro/clients?source=${source}` : '/api/serpro/clients';
      const res = await fetch(url)

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Resposta inesperada da API");
      }

      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setClients(data)
        } else {
          console.error('Invalid data format received:', data)
          setClients([])
        }
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError(true)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  if (loading) {
    return <div className="text-sm text-zinc-500 animate-pulse">Carregando últimas consultas...</div>
  }

  if (error) {
    return (
      <div className="mt-8 flex items-center gap-3 text-sm text-zinc-500">
        <span>Backend indisponível — não foi possível carregar as últimas consultas.</span>
        <button
          onClick={fetchClients}
          className="px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (clients.length === 0) {
    return null
  }

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        Últimas Consultas
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {clients.map((client) => (
          <ClientCard key={client.id || client.cnpj} client={client} onSelectCnpj={onSelectCnpj} />
        ))}
      </div>
    </div>
  )
}

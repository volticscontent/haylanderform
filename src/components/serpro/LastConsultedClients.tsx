'use client'

import { useEffect, useState } from 'react'
import { SerproClient } from '@/types/client'
import ClientCard from './ClientCard'

export default function LastConsultedClients() {
  const [clients, setClients] = useState<SerproClient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      // Use absolute URL or ensure it works client-side
      const res = await fetch('/api/serpro/clients')
      
      // Handle HTML response (error page) instead of JSON
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") === -1) {
        throw new Error("Received non-JSON response from API");
      }

      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setClients(data)
        } else {
           console.error('Invalid data format received:', data)
           setClients([])
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      // Fail silently for the user, just don't show the list
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-zinc-500 animate-pulse">Carregando últimas consultas...</div>
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
          <ClientCard key={client.id || client.cnpj} client={client} />
        ))}
      </div>
    </div>
  )
}

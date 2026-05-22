import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { backendGet } from '@/lib/backend-proxy'
import LeadList from './LeadList'

async function getData(page: number = 1, limit: number = 50) {
  try {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    const res = await backendGet('/api/leads/list', params)
    if (!res.ok) {
      const err = await res.text()
      return { data: [], total: 0, error: `Backend ${res.status}: ${err}` }
    }
    const json = await res.json() as { data: unknown[]; total: number }
    return { data: json.data, total: json.total, error: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Lista fetch error:', msg)
    return { data: [], total: 0, error: msg }
  }
}

export default async function ListPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')

  const { verifyAdminSession } = await import('@/lib/dashboard-auth')
  const isValid = await verifyAdminSession(session?.value)

  if (!isValid) {
    redirect('/login')
  }

  const { page: pageParam } = await searchParams
  const page = Number(pageParam) || 1
  const limit = 50
  const { data, total, error } = await getData(page, limit)

  return (
    <div className="space-y-6 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Base de Contatos</h1>
      </div>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-mono">
          <strong>Erro DB:</strong> {error}
        </div>
      )}
      <LeadList 
        data={data} 
        pagination={{
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }} 
      />
    </div>
  )
}

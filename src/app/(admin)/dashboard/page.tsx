import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { backendGet } from '@/lib/backend-proxy'
import DashboardCharts from './DashboardCharts'

async function getData() {
  try {
    const res = await backendGet('/api/dashboard')
    if (!res.ok) return []
    return await res.json()
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return []
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  
  const { verifyAdminSession } = await import('@/lib/dashboard-auth')
  const isValid = await verifyAdminSession(session?.value)

  if (!isValid) {
    redirect('/login')
  }

  const data = await getData()

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Dashboard Analítico</h1>
      </div>
      <DashboardCharts data={data} />
    </div>
  )
}

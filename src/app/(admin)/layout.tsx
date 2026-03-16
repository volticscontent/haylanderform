import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/AdminShell'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')

  const { verifyAdminSession, getSession } = await import('@/lib/dashboard-auth')
  const isLoggedIn = !!session && await verifyAdminSession(session.value)
  const colaborador = isLoggedIn ? await getSession(session!.value) : null

  async function logout() {
    'use server'
    const cookieStore = await cookies()
    cookieStore.delete('admin_session')
    redirect('/login')
  }

  return (
    <AdminShell
      isLoggedIn={isLoggedIn}
      onLogout={logout}
      nomeColaborador={colaborador?.nome || null}
      permissoes={colaborador?.permissoes || []}
    >
      {children}
    </AdminShell>
  )
}

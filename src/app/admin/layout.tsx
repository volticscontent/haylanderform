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

  // Lazy import or direct import if at top
  const { verifyAdminSession } = await import('@/lib/admin-auth')
  const isLoggedIn = !!session && await verifyAdminSession(session.value)

  async function logout() {
    'use server'
    const cookieStore = await cookies()
    cookieStore.delete('admin_session')
    redirect('/admin/login')
  }

  return (
    <AdminShell isLoggedIn={isLoggedIn} onLogout={logout}>
      {children}
    </AdminShell>
  )
}

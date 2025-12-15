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
  const isLoggedIn = !!session && session.value === 'true'

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

'use client'

import AdminSidebar from '@/components/AdminSidebar'
import { LogOut, Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { AdminProvider, useAdmin } from '@/contexts/AdminContext'

function AdminShellContent({
  children,
  isLoggedIn,
  onLogout
}: {
  children: React.ReactNode
  isLoggedIn: boolean
  onLogout: () => Promise<void>
}) {
  const { isSidebarOpen, setSidebarOpen, isDesktopSidebarOpen } = useAdmin()
  const pathname = usePathname()
  const isChatPage = pathname?.startsWith('/admin/atendimento')

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      {isLoggedIn && (
        <AdminSidebar 
          isOpen={isSidebarOpen} 
          isDesktopOpen={isDesktopSidebarOpen}
          onClose={() => setSidebarOpen(false)} 
        />
      )}
      
      <main className={`
        min-h-screen transition-all duration-200
        ${isLoggedIn && isDesktopSidebarOpen ? 'lg:pl-64' : ''}
        ${isChatPage ? 'h-screen overflow-hidden' : ''}
      `}>
        <div className={isChatPage ? 'h-full' : 'sm:p-8 p-4'}>
           {isLoggedIn && !isChatPage && (
             <div className="flex justify-between items-center mb-6">
                {/* Mobile Menu Button */}
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 -ml-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  <Menu className="w-6 h-6" />
                </button>

                <div className="flex-1 lg:hidden" /> {/* Spacer */}

                <form action={onLogout}>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-600 hover:text-red-600 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </form>
             </div>
           )}
           {children}
        </div>
      </main>
    </div>
  )
}

export default function AdminShell({
  children,
  isLoggedIn,
  onLogout
}: {
  children: React.ReactNode
  isLoggedIn: boolean
  onLogout: () => Promise<void>
}) {
  return (
    <AdminProvider>
      <AdminShellContent isLoggedIn={isLoggedIn} onLogout={onLogout}>
        {children}
      </AdminShellContent>
    </AdminProvider>
  )
}

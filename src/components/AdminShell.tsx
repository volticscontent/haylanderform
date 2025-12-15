'use client'

import { useState } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { LogOut, Menu } from 'lucide-react'

export default function AdminShell({
  children,
  isLoggedIn,
  onLogout
}: {
  children: React.ReactNode
  isLoggedIn: boolean
  onLogout: () => Promise<void>
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      {isLoggedIn && (
        <AdminSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
      )}
      
      <main className={`
        min-h-screen transition-all duration-200
        ${isLoggedIn ? 'lg:pl-64' : ''}
      `}>
        <div className="sm:p-8">
           {isLoggedIn && (
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

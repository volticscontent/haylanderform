'use client'

import { createContext, useContext, useState } from 'react'

type AdminContextType = {
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  isDesktopSidebarOpen: boolean
  setDesktopSidebarOpen: (open: boolean) => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false) // Mobile sidebar state
  const [isDesktopSidebarOpen, setDesktopSidebarOpen] = useState(true) // Desktop sidebar state

  return (
    <AdminContext.Provider value={{ isSidebarOpen, setSidebarOpen, isDesktopSidebarOpen, setDesktopSidebarOpen }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (!context) throw new Error('useAdmin must be used within AdminProvider')
  return context
}

'use client'

import { useAuth } from '@/hooks/use-auth'
import { Navbar } from './navbar'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner message='Cargando aplicación...' />
  }

  if (!user) {
    return children // Para páginas de auth
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />
      <main>{children}</main>
    </div>
  )
}

'use client'

import { useAuth } from '@/hooks/use-auth'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Package, Users, Settings, LogOut, Plus, List } from 'lucide-react'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!user) return null

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    ...(profile?.role === 'admin'
      ? [
          { name: 'Crear Pedido', href: '/admin/create-order', icon: Plus },
          { name: 'Gestionar Pedidos', href: '/admin/orders', icon: Package },
          { name: 'Usuarios', href: '/admin/users', icon: Users }
        ]
      : [{ name: 'Mis Pedidos', href: '/worker/orders', icon: List }]),
    { name: 'Configuración', href: '/settings', icon: Settings }
  ]

  return (
    <nav className='bg-white shadow-sm border-b'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          {/* Logo y navegación */}
          <div className='flex'>
            <div className='flex-shrink-0 flex items-center'>
              <Package className='h-8 w-8 text-blue-600' />
              <span className='ml-2 text-xl font-bold text-gray-900'>Orders App</span>
            </div>

            <div className='hidden sm:ml-6 sm:flex sm:space-x-8'>
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className='h-4 w-4 mr-2' />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Usuario y logout */}
          <div className='flex items-center space-x-4'>
            <div className='text-right'>
              <div className='text-sm font-medium text-gray-900'>{profile?.full_name || user.email}</div>
              <div className='text-xs text-gray-500'>{profile?.role === 'admin' ? 'Administrador' : 'Trabajador'}</div>
            </div>

            <button
              onClick={handleSignOut}
              className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              <LogOut className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>

      {/* Navegación móvil */}
      <div className='sm:hidden'>
        <div className='pt-2 pb-3 space-y-1'>
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <div className='flex items-center'>
                  <Icon className='h-4 w-4 mr-3' />
                  {item.name}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

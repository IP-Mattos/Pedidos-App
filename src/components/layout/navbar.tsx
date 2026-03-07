'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Home, Package, Users, Settings, LogOut, Plus, List } from 'lucide-react'
import { UnifrakturCook, Inter } from 'next/font/google'
import { useAuth } from '@/hooks/use-auth'

const gothic = UnifrakturCook({
  subsets: ['latin'],
  weight: '700'
})

const inter = Inter({
  subsets: ['latin']
})

function BrandLogo() {
  return (
    <Link href='/'>
      <svg width='180' height='60' viewBox='0 0 180 60' xmlns='http://www.w3.org/2000/svg'>
        <defs>
          <style>
            {`@import url('https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&display=swap');`}
          </style>
        </defs>

        {/* "Autoservice" pequeño arriba */}
        <text
          x='38'
          y='18'
          fill='white'
          fontFamily='Inter, sans-serif'
          fontSize='10'
          letterSpacing='2'
          fontWeight='300'
        >
          Autoservice
        </text>

        {/* "Patricia" completo en gótico */}
        <text x='0' y='56' fill='white' fontFamily='UnifrakturCook, serif' fontSize='48' fontWeight='700'>
          Patricia
        </text>
      </svg>
    </Link>
  )
}

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

  const isActiveRoute = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className={`${inter.className} sticky top-0 z-50 border-b border-red-800/80 bg-gradient-to-r from-red-800 via-red-700 to-red-800 shadow-lg`}
    >
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex min-h-[76px] items-center justify-between gap-4'>
          <div className='flex items-center gap-8'>
            <BrandLogo />

            <div className='hidden sm:flex sm:items-center sm:gap-1'>
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = isActiveRoute(item.href)

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white/12 text-white shadow-inner ring-1 ring-white/20'
                        : 'text-red-100/85 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`mr-2 h-4 w-4 transition-transform duration-200 ${
                        isActive ? 'scale-100' : 'group-hover:scale-110'
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className='hidden sm:flex items-center gap-3'>
            <div className='rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-right backdrop-blur-sm'>
              <div className='max-w-[220px] truncate text-sm font-semibold text-white'>
                {profile?.full_name || user.email}
              </div>
              <div className='text-xs text-red-100/80'>
                {profile?.role === 'admin' ? 'Administrador' : 'Trabajador'}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              aria-label='Cerrar sesión'
              title='Cerrar sesión'
              className='inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/8 p-2.5 text-red-100 transition-all duration-200 hover:bg-white/14 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40'
            >
              <LogOut className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>

      <div className='sm:hidden border-t border-white/10 bg-red-800/60 backdrop-blur-sm'>
        <div className='px-3 py-3 space-y-1'>
          <div className='mb-3 rounded-xl border border-white/10 bg-white/8 px-3 py-3'>
            <div className='truncate text-sm font-semibold text-white'>{profile?.full_name || user.email}</div>
            <div className='text-xs text-red-100/80'>{profile?.role === 'admin' ? 'Administrador' : 'Trabajador'}</div>
          </div>

          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = isActiveRoute(item.href)

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/12 text-white ring-1 ring-white/20'
                    : 'text-red-100/85 hover:bg-white/8 hover:text-white'
                }`}
              >
                <Icon className='mr-3 h-4 w-4' />
                {item.name}
              </Link>
            )
          })}

          <button
            onClick={handleSignOut}
            className='flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium text-red-100/85 transition-all hover:bg-white/8 hover:text-white'
          >
            <LogOut className='mr-3 h-4 w-4' />
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  )
}

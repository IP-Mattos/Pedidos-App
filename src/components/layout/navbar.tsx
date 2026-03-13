'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  Package,
  Users,
  Settings,
  LogOut,
  Plus,
  List,
  BarChart3,
  Menu,
  X,
  Trophy,
  ChevronDown,
  LayoutDashboard,
  BookOpen,
  UserRound
} from 'lucide-react'
import { Inter } from 'next/font/google'
import { useAuth } from '@/hooks/use-auth'
import { useBranding } from '@/hooks/use-branding'

const inter = Inter({ subsets: ['latin'] })

const ADMIN_ITEMS = [
  { name: 'Crear Pedido', href: '/admin/create-order', icon: Plus },
  { name: 'Panel', href: '/admin/board', icon: LayoutDashboard },
  { name: 'Pedidos', href: '/admin/orders', icon: Package },
  { name: 'Clientes', href: '/admin/customers', icon: UserRound },
  { name: 'Usuarios', href: '/admin/users', icon: Users },
  { name: 'Reportes', href: '/admin/reports', icon: BarChart3 },
  { name: 'Ranking', href: '/admin/ranking', icon: Trophy }
]

function BrandLogo({ businessName, subtitle }: { businessName: string; subtitle: string }) {
  return (
    <Link href='/'>
      <svg width='180' height='60' viewBox='0 0 180 60' xmlns='http://www.w3.org/2000/svg'>
        <defs>
          <style>
            {`@import url('https://fonts.googleapis.com/css2?family=UnifrakturCook:wght@700&display=swap');`}
          </style>
        </defs>
        <text
          x='38'
          y='18'
          fill='white'
          fontFamily='Inter, sans-serif'
          fontSize='10'
          letterSpacing='2'
          fontWeight='300'
        >
          {subtitle}
        </text>
        <text x='0' y='56' fill='white' fontFamily='UnifrakturCook, serif' fontSize='48' fontWeight='700'>
          {businessName}
        </text>
      </svg>
    </Link>
  )
}

function AdminDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const isAnyAdminActive = ADMIN_ITEMS.some((i) => pathname.startsWith(i.href))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className='relative'>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`group inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
          isAnyAdminActive
            ? 'bg-white/12 text-white shadow-inner ring-1 ring-white/20'
            : 'text-red-100/85 hover:bg-white/8 hover:text-white'
        }`}
      >
        <LayoutDashboard className='h-4 w-4' />
        Gestión
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className='absolute left-0 top-full mt-2 w-52 rounded-xl border border-white/10 bg-red-900/95 backdrop-blur-sm shadow-xl overflow-hidden z-50'>
          {ADMIN_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  isActive ? 'bg-white/15 text-white font-medium' : 'text-red-100/80 hover:bg-white/8 hover:text-white'
                }`}
              >
                <Icon className='h-4 w-4 flex-shrink-0' />
                {item.name}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { branding } = useBranding()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!user) return null

  const roleLabel =
    profile?.role === 'admin' ? 'Administrador' : profile?.role === 'delivery' ? 'Delivery' : 'Trabajador'

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  const navStyle = {
    background: `linear-gradient(to right, color-mix(in srgb, ${branding.navColor} 80%, black), color-mix(in srgb, ${branding.navColor} 90%, white 5%), color-mix(in srgb, ${branding.navColor} 80%, black))`,
    borderBottom: `1px solid color-mix(in srgb, ${branding.navColor} 60%, black)`
  }

  return (
    <nav className={`${inter.className} sticky top-0 z-50 shadow-lg`} style={navStyle}>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='flex min-h-[76px] items-center justify-between gap-4'>
          {/* Left: logo + nav */}
          <div className='flex items-center gap-6'>
            <BrandLogo businessName={branding.businessName} subtitle={branding.subtitle} />

            {/* Desktop nav */}
            <div className='hidden sm:flex sm:items-center sm:gap-1'>
              {profile?.role === 'admin' && <AdminDropdown pathname={pathname} />}
              <Link
                href='/'
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive('/guia')
                    ? 'bg-white/12 text-white shadow-inner ring-1 ring-white/20'
                    : 'text-red-100/85 hover:bg-white/8 hover:text-white'
                }`}
              >
                <Package className='h-4 w-4' />
                Pedidos
              </Link>
              {profile?.role === 'worker' && (
                <Link
                  href='/worker/orders'
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive('/worker/orders')
                      ? 'bg-white/12 text-white shadow-inner ring-1 ring-white/20'
                      : 'text-red-100/85 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <List className='h-4 w-4' />
                  Mis Pedidos
                </Link>
              )}

              <Link
                href='/guia'
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive('/guia')
                    ? 'bg-white/12 text-white shadow-inner ring-1 ring-white/20'
                    : 'text-red-100/85 hover:bg-white/8 hover:text-white'
                }`}
              >
                <BookOpen className='h-4 w-4' />
                Guía
              </Link>

              <Link
                href='/settings'
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive('/settings')
                    ? 'bg-white/12 text-white shadow-inner ring-1 ring-white/20'
                    : 'text-red-100/85 hover:bg-white/8 hover:text-white'
                }`}
              >
                <Settings className='h-4 w-4' />
                Configuración
              </Link>
            </div>
          </div>

          {/* Right: user + logout (desktop) */}
          <div className='hidden sm:flex items-center gap-3'>
            <div className='rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-right backdrop-blur-sm'>
              <div className='max-w-[200px] truncate text-sm font-semibold text-white'>
                {profile?.full_name || user.email}
              </div>
              <div className='text-xs text-red-100/80'>{roleLabel}</div>
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

          {/* Burger — mobile */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            className='sm:hidden inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/8 p-2.5 text-red-100 transition-all hover:bg-white/14 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40'
          >
            {menuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className='sm:hidden border-t border-white/10 bg-red-800/95 backdrop-blur-sm'>
          <div className='px-3 py-3 space-y-1'>
            {/* User info */}
            <div className='mb-3 rounded-xl border border-white/10 bg-white/8 px-3 py-3'>
              <div className='truncate text-sm font-semibold text-white'>{profile?.full_name || user.email}</div>
              <div className='text-xs text-red-100/80'>{roleLabel}</div>
            </div>

            {/* Admin items (flat in mobile) */}
            {profile?.role === 'admin' &&
              ADMIN_ITEMS.map((item) => {
                const Icon = item.icon
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                      active
                        ? 'bg-white/12 text-white ring-1 ring-white/20'
                        : 'text-red-100/85 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <Icon className='mr-3 h-4 w-4' />
                    {item.name}
                  </Link>
                )
              })}

            {profile?.role === 'worker' && (
              <Link
                href='/worker/orders'
                onClick={() => setMenuOpen(false)}
                className={`flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                  isActive('/worker/orders')
                    ? 'bg-white/12 text-white ring-1 ring-white/20'
                    : 'text-red-100/85 hover:bg-white/8 hover:text-white'
                }`}
              >
                <List className='mr-3 h-4 w-4' />
                Mis Pedidos
              </Link>
            )}

            <Link
              href='/guia'
              onClick={() => setMenuOpen(false)}
              className={`flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                isActive('/guia')
                  ? 'bg-white/12 text-white ring-1 ring-white/20'
                  : 'text-red-100/85 hover:bg-white/8 hover:text-white'
              }`}
            >
              <BookOpen className='mr-3 h-4 w-4' />
              Guía
            </Link>

            <Link
              href='/settings'
              onClick={() => setMenuOpen(false)}
              className={`flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                isActive('/settings')
                  ? 'bg-white/12 text-white ring-1 ring-white/20'
                  : 'text-red-100/85 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Settings className='mr-3 h-4 w-4' />
              Configuración
            </Link>

            <button
              onClick={handleSignOut}
              className='flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium text-red-100/85 transition-all hover:bg-white/8 hover:text-white'
            >
              <LogOut className='mr-3 h-4 w-4' />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

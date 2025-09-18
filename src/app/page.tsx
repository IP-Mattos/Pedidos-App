'use client'

import { useAuth } from '@/hooks/use-auth'
import { MainLayout } from '@/components/layout/main-layout'
import { NoSSR } from '@/components/ui/no-ssr'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from 'next/link'
import { Package, Users, TrendingUp, Clock, Plus, List, BarChart3 } from 'lucide-react'
import { Profile } from '@/types/database'

interface User {
  id: string
  email?: string
  email_confirmed_at?: string | null
}

interface AuthenticatedViewProps {
  user: User
  profile: Profile | null
  signOut: () => Promise<void>
}

function UnauthenticatedView() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full text-center space-y-8'>
        <div>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>Orders App</h1>
          <p className='text-gray-600 mb-8'>Sistema de pedidos en tiempo real</p>
        </div>

        <div className='space-y-4'>
          <Link href='/login'>
            <button className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors'>
              Iniciar Sesión
            </button>
          </Link>

          <Link href='/register'>
            <button className='w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors'>
              Crear Cuenta
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function DashboardStats() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
      <div className='bg-white overflow-hidden shadow rounded-lg'>
        <div className='p-5'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <Package className='h-6 w-6 text-gray-400' />
            </div>
            <div className='ml-5 w-0 flex-1'>
              <dl>
                <dt className='text-sm font-medium text-gray-500 truncate'>Total Pedidos</dt>
                <dd className='text-lg font-medium text-gray-900'>12</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-white overflow-hidden shadow rounded-lg'>
        <div className='p-5'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <Clock className='h-6 w-6 text-yellow-400' />
            </div>
            <div className='ml-5 w-0 flex-1'>
              <dl>
                <dt className='text-sm font-medium text-gray-500 truncate'>Pendientes</dt>
                <dd className='text-lg font-medium text-gray-900'>3</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-white overflow-hidden shadow rounded-lg'>
        <div className='p-5'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <TrendingUp className='h-6 w-6 text-green-400' />
            </div>
            <div className='ml-5 w-0 flex-1'>
              <dl>
                <dt className='text-sm font-medium text-gray-500 truncate'>Completados</dt>
                <dd className='text-lg font-medium text-gray-900'>9</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-white overflow-hidden shadow rounded-lg'>
        <div className='p-5'>
          <div className='flex items-center'>
            <div className='flex-shrink-0'>
              <Users className='h-6 w-6 text-blue-400' />
            </div>
            <div className='ml-5 w-0 flex-1'>
              <dl>
                <dt className='text-sm font-medium text-gray-500 truncate'>Clientes</dt>
                <dd className='text-lg font-medium text-gray-900'>8</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AdminDashboard({ profile }: { profile: Profile | null }) {
  return (
    <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
      <div className='px-4 py-6 sm:px-0'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Dashboard Administrativo</h1>
          <p className='mt-2 text-gray-600'>Bienvenido, {profile?.full_name}. Gestiona todos los pedidos desde aquí.</p>
        </div>

        <DashboardStats />

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Acciones rápidas */}
          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>Acciones Rápidas</h2>
            <div className='space-y-3'>
              <Link href='/admin/create-order'>
                <button className='w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700'>
                  <Plus className='h-4 w-4 mr-2' />
                  Crear Nuevo Pedido
                </button>
              </Link>

              <Link href='/admin/orders'>
                <button className='w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'>
                  <List className='h-4 w-4 mr-2' />
                  Ver Todos los Pedidos
                </button>
              </Link>

              <Link href='/admin/reports'>
                <button className='w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'>
                  <BarChart3 className='h-4 w-4 mr-2' />
                  Ver Reportes
                </button>
              </Link>
            </div>
          </div>

          {/* Pedidos recientes */}
          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>Pedidos Recientes</h2>
            <div className='space-y-3'>
              <div className='text-sm text-gray-500'>Próximamente: Lista de pedidos recientes...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkerDashboard({ profile }: { profile: Profile | null }) {
  return (
    <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
      <div className='px-4 py-6 sm:px-0'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Panel de Trabajador</h1>
          <p className='mt-2 text-gray-600'>Bienvenido, {profile?.full_name}. Aquí puedes ver tus pedidos asignados.</p>
        </div>

        <div className='bg-white shadow rounded-lg p-6'>
          <h2 className='text-lg font-medium text-gray-900 mb-4'>Mis Pedidos</h2>
          <div className='text-center py-8'>
            <Package className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>No hay pedidos asignados</h3>
            <p className='mt-1 text-sm text-gray-500'>
              Los pedidos aparecerán aquí cuando sean asignados por un administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthenticatedView({ user, profile, signOut }: AuthenticatedViewProps) {
  return (
    <MainLayout>
      {profile?.role === 'admin' ? <AdminDashboard profile={profile} /> : <WorkerDashboard profile={profile} />}
    </MainLayout>
  )
}

export default function HomePage() {
  const { user, profile, isHydrated } = useAuth()

  if (!isHydrated) {
    return <LoadingSpinner message='Cargando...' />
  }

  if (!user) {
    return <UnauthenticatedView />
  }

  return (
    <NoSSR fallback={<LoadingSpinner />}>
      <AuthenticatedView user={user} profile={profile} signOut={() => Promise.resolve()} />
    </NoSSR>
  )
}

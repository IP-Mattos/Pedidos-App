'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Package } from 'lucide-react'

import { MainLayout } from '@/components/layout/main-layout'
import { OrderCard } from '@/components/orders/order-card'
import { useOrders } from '@/hooks/use-orders'
import { useAuth } from '@/hooks/use-auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Order, Profile } from '@/types/database'

interface AuthenticatedViewProps {
  user: {
    id: string
    email?: string
    email_confirmed_at?: string | null
  }
  profile: Profile | null
  signOut: () => Promise<void>
}

export default function AdminOrdersPage() {
  const { orders, loading, error } = useOrders()
  const { profile } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  if (profile?.role !== 'admin') {
    return (
      <MainLayout>
        <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-900'>Acceso Denegado</h1>
            <p className='text-gray-600'>No tienes permisos para ver esta página.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner message='Cargando pedidos...' />
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-red-600'>Error</h1>
            <p className='text-gray-600'>{error}</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Filtrar pedidos
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Estadísticas
  const stats = {
    total: orders.length,
    pendientes: orders.filter((o) => o.status === 'pendiente').length,
    en_proceso: orders.filter((o) => o.status === 'en_proceso').length,
    completados: orders.filter((o) => o.status === 'completado').length,
    entregados: orders.filter((o) => o.status === 'entregado').length
  }

  return (
    <MainLayout>
      <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Gestión de Pedidos</h1>
              <p className='mt-2 text-gray-600'>Administra todos los pedidos del sistema</p>
            </div>
            <Link href='/admin/create-order'>
              <button className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
                <Plus className='h-4 w-4 mr-2' />
                Nuevo Pedido
              </button>
            </Link>
          </div>
        </div>

        {/* Estadísticas */}
        <div className='grid grid-cols-1 md:grid-cols-5 gap-6 mb-8'>
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <Package className='h-6 w-6 text-gray-400' />
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Total</dt>
                    <dd className='text-lg font-medium text-gray-900'>{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-6 h-6 bg-yellow-400 rounded'></div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Pendientes</dt>
                    <dd className='text-lg font-medium text-gray-900'>{stats.pendientes}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-6 h-6 bg-blue-400 rounded'></div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>En Proceso</dt>
                    <dd className='text-lg font-medium text-gray-900'>{stats.en_proceso}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-6 h-6 bg-green-400 rounded'></div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Completados</dt>
                    <dd className='text-lg font-medium text-gray-900'>{stats.completados}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-6 h-6 bg-green-600 rounded'></div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Entregados</dt>
                    <dd className='text-lg font-medium text-gray-900'>{stats.entregados}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className='bg-white shadow rounded-lg p-6 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
              <input
                type='text'
                placeholder='Buscar por cliente o ID...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            <div className='relative'>
              <Filter className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='all'>Todos los estados</option>
                <option value='pendiente'>Pendientes</option>
                <option value='en_proceso'>En Proceso</option>
                <option value='completado'>Completados</option>
                <option value='entregado'>Entregados</option>
                <option value='cancelado'>Cancelados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de pedidos */}
        {filteredOrders.length === 0 ? (
          <div className='text-center py-12'>
            <Package className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>No hay pedidos</h3>
            <p className='mt-1 text-sm text-gray-500'>
              {orders.length === 0
                ? 'Comienza creando tu primer pedido.'
                : 'No hay pedidos que coincidan con los filtros.'}
            </p>
            {orders.length === 0 && (
              <div className='mt-6'>
                <Link href='/admin/create-order'>
                  <button className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'>
                    <Plus className='mr-2 h-4 w-4' />
                    Crear Primer Pedido
                  </button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} isAdmin={true} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

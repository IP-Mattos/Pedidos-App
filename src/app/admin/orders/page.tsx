'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Package, ChevronLeft, ChevronRight, ClipboardList, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

import { MainLayout } from '@/components/layout/main-layout'
import { OrderCard } from '@/components/orders/order-card'
import { useOrders } from '@/hooks/use-orders'
import { useAuth } from '@/hooks/use-auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { OrdersService } from '@/lib/services/order-services'
import toast from 'react-hot-toast'

export default function AdminOrdersPage() {
  const { orders, loading, error } = useOrders()
  const { profile } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6

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
        <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 text-center'>
          <h1 className='text-2xl font-bold text-red-600'>Error</h1>
          <p className='text-gray-600'>{error}</p>
        </div>
      </MainLayout>
    )
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    const entrega = order.fecha_entrega.split('T')[0]
    const matchesFrom = !dateFrom || entrega >= dateFrom
    const matchesTo = !dateTo || entrega <= dateTo

    return matchesSearch && matchesStatus && matchesFrom && matchesTo
  })

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE)
  const paginatedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const today = new Date().toISOString().split('T')[0]
  const stats = [
    {
      label: 'Total Pedidos',
      value: orders.length,
      icon: ClipboardList,
      iconColor: 'text-blue-400'
    },
    {
      label: 'En Proceso',
      value: orders.filter((o) => o.status === 'en_proceso').length,
      icon: Clock,
      iconColor: 'text-yellow-400'
    },
    {
      label: 'Completados',
      value: orders.filter((o) => ['completado', 'pagado', 'entregado'].includes(o.status)).length,
      icon: CheckCircle,
      iconColor: 'text-green-400'
    },
    {
      label: 'Vencidos',
      value: orders.filter(
        (o) => o.fecha_entrega.split('T')[0] < today && !['pagado', 'entregado', 'cancelado'].includes(o.status)
      ).length,
      icon: AlertTriangle,
      iconColor: 'text-red-400'
    }
  ]

  const handleCancelConfirm = async () => {
    if (!pendingCancelId) return
    setIsCancelling(true)
    try {
      await OrdersService.updateOrderStatus(pendingCancelId, 'cancelado')
      toast.success('Pedido cancelado')
    } catch {
      toast.error('Error al cancelar el pedido')
    } finally {
      setIsCancelling(false)
      setPendingCancelId(null)
    }
  }

  return (
    <MainLayout>
      <ConfirmDialog
        open={!!pendingCancelId}
        title='¿Cancelar este pedido?'
        message='Podés revertirlo luego desde el detalle si es necesario.'
        confirmLabel={isCancelling ? 'Cancelando...' : 'Sí, cancelar'}
        onConfirm={handleCancelConfirm}
        onCancel={() => setPendingCancelId(null)}
      />

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
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className='bg-white overflow-hidden shadow rounded-lg'>
                <div className='p-5'>
                  <div className='flex items-center'>
                    <div className='flex-shrink-0'>
                      <Icon className={`h-6 w-6 ${s.iconColor}`} />
                    </div>
                    <div className='ml-5 w-0 flex-1'>
                      <dl>
                        <dt className='text-sm font-medium text-gray-500 truncate'>{s.label}</dt>
                        <dd className='text-lg font-medium text-gray-900'>{s.value}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filtros */}
        <div className='bg-white shadow rounded-lg p-6 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
              <input
                type='text'
                placeholder='Buscar por cliente o ID...'
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
              />
            </div>

            <div className='relative'>
              <Filter className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
              >
                <option value='all'>Todos los estados</option>
                <option value='pendiente'>Pendientes</option>
                <option value='en_proceso'>En Proceso</option>
                <option value='completado'>Completados</option>
                <option value='pagado'>Pagados</option>
                <option value='entregado'>Entregados</option>
                <option value='cancelado'>Cancelados</option>
              </select>
            </div>

            <div>
              <label className='block text-xs text-gray-500 mb-1'>Entrega desde</label>
              <input
                type='date'
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
              />
            </div>

            <div>
              <label className='block text-xs text-gray-500 mb-1'>Entrega hasta</label>
              <input
                type='date'
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
              />
            </div>
          </div>
          {(searchTerm || statusFilter !== 'all' || dateFrom || dateTo) && (
            <div className='mt-3 flex items-center justify-between'>
              <p className='text-sm text-gray-500'>{filteredOrders.length} resultado(s)</p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setDateFrom('')
                  setDateTo('')
                  setPage(1)
                }}
                className='text-xs text-blue-600 hover:underline'
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Lista de pedidos */}
        {filteredOrders.length === 0 ? (
          <div className='text-center py-12 bg-white rounded-lg shadow'>
            <Package className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>No hay pedidos</h3>
            <p className='mt-1 text-sm text-gray-500'>
              {orders.length === 0 ? 'Comienza creando tu primer pedido.' : 'No hay pedidos que coincidan con los filtros.'}
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
          <>
            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
              {paginatedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isAdmin={true}
                  onRequestCancel={(orderId) => setPendingCancelId(orderId)}
                />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className='mt-6 flex items-center justify-between'>
                <p className='text-sm text-gray-500'>
                  Página {page} de {totalPages} · {filteredOrders.length} pedidos
                </p>
                <div className='flex items-center gap-1'>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className='inline-flex items-center px-2.5 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed'
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`inline-flex items-center px-3 py-1.5 text-sm border rounded-md transition-colors ${
                        p === page
                          ? 'border-blue-500 bg-blue-600 text-white'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className='inline-flex items-center px-2.5 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed'
                  >
                    <ChevronRight className='h-4 w-4' />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}

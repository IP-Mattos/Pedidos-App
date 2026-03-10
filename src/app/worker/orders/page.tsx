'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { WorkerOrderCard } from '@/components/orders/worker-order-card'
import { ProgressModal } from '@/components/orders/progress-modal'
import { useWorkerOrders } from '@/hooks/use-orders'
import { useAuth } from '@/hooks/use-auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Package, Clock, User, CheckCircle, History, Calendar, DollarSign } from 'lucide-react'

export default function WorkerOrdersPage() {
  const { user, profile } = useAuth()
  const { availableOrders, myOrders, loading, error, silentRefetch } = useWorkerOrders(user?.id || '')
  const [progressModal, setProgressModal] = useState<{
    isOpen: boolean
    orderId: string
    currentStatus: string
  }>({ isOpen: false, orderId: '', currentStatus: '' })

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

  const openProgressModal = (orderId: string, currentStatus: string) => {
    setProgressModal({ isOpen: true, orderId, currentStatus })
  }

  const closeProgressModal = () => {
    setProgressModal({ isOpen: false, orderId: '', currentStatus: '' })
  }

  const handleUpdate = () => {
    silentRefetch()
  }

  const activeOrders = myOrders.filter((o) => o.status === 'en_proceso')
  const completedOrders = myOrders.filter((o) => ['completado', 'entregado'].includes(o.status))

  // Estadísticas para el worker
  const myOrdersStats = {
    total: myOrders.length,
    en_proceso: activeOrders.length,
    completados: myOrders.filter((o) => o.status === 'completado').length,
    entregados: myOrders.filter((o) => o.status === 'entregado').length
  }

  return (
    <MainLayout>
      <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Panel de Trabajador</h1>
          <p className='mt-2 text-gray-600'>
            Bienvenido, {profile?.full_name}. Toma pedidos disponibles y actualiza su progreso.
          </p>
        </div>

        {/* Estadísticas del worker */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <User className='h-6 w-6 text-blue-400' />
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Mis Pedidos</dt>
                    <dd className='text-lg font-medium text-gray-900'>{myOrdersStats.total}</dd>
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
                    <dt className='text-sm font-medium text-gray-500 truncate'>En Proceso</dt>
                    <dd className='text-lg font-medium text-gray-900'>{myOrdersStats.en_proceso}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <Package className='h-6 w-6 text-green-400' />
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Completados</dt>
                    <dd className='text-lg font-medium text-gray-900'>{myOrdersStats.completados}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <CheckCircle className='h-6 w-6 text-green-600' />
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Entregados</dt>
                    <dd className='text-lg font-medium text-gray-900'>{myOrdersStats.entregados}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pedidos disponibles */}
        <div className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Pedidos Disponibles
            <span className='ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
              {availableOrders.length} disponibles
            </span>
          </h2>

          {availableOrders.length === 0 ? (
            <div className='text-center py-12 bg-white rounded-lg shadow'>
              <Package className='mx-auto h-12 w-12 text-gray-400' />
              <h3 className='mt-2 text-sm font-medium text-gray-900'>No hay pedidos disponibles</h3>
              <p className='mt-1 text-sm text-gray-500'>
                Los nuevos pedidos aparecerán aquí cuando sean creados por los administradores.
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
              {availableOrders.map((order) => (
                <WorkerOrderCard key={order.id} order={order} onUpdateProgress={openProgressModal} />
              ))}
            </div>
          )}
        </div>

        {/* Mis pedidos activos */}
        {activeOrders.length > 0 && (
          <div className='mb-8'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>Mis Pedidos Activos</h2>
            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
              {activeOrders.map((order) => (
                <WorkerOrderCard key={order.id} order={order} onUpdateProgress={openProgressModal} />
              ))}
            </div>
          </div>
        )}

        {/* Historial de pedidos completados */}
        {completedOrders.length > 0 && (
          <div className='mb-8'>
            <div className='flex items-center gap-3 mb-4'>
              <History className='h-6 w-6 text-gray-400' />
              <h2 className='text-2xl font-bold text-gray-900'>Mis Pedidos Completados</h2>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                {completedOrders.length}
              </span>
            </div>
            <div className='bg-white shadow rounded-lg divide-y'>
              {completedOrders.map((order) => (
                <div key={order.id} className='px-5 py-4 flex flex-wrap items-center justify-between gap-3'>
                  <div>
                    <p className='text-sm font-semibold text-gray-900'>{order.nombre_cliente}</p>
                    <p className='text-xs text-gray-400 mt-0.5'>#{order.id.slice(-8)}</p>
                  </div>
                  <div className='flex items-center gap-4 text-xs text-gray-500'>
                    <span className='flex items-center gap-1'>
                      <Calendar className='h-3.5 w-3.5' />
                      {new Date(order.fecha_entrega).toLocaleDateString()}
                    </span>
                    <span className='flex items-center gap-1'>
                      <DollarSign className='h-3.5 w-3.5' />
                      ${order.monto_total.toFixed(2)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
                      order.status === 'entregado'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status === 'entregado' ? 'Entregado' : 'Completado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indicador de tiempo real */}
        <div className='text-center'>
          <div className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
            <div className='w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse'></div>
            Actualizaciones en tiempo real activadas
          </div>
        </div>

        {/* Modal de progreso */}
        {progressModal.isOpen && (
          <ProgressModal
            orderId={progressModal.orderId}
            currentStatus={progressModal.currentStatus}
            onClose={closeProgressModal}
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </MainLayout>
  )
}

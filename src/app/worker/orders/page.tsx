'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { WorkerOrderCard } from '@/components/orders/worker-order-card'
import { ProgressModal } from '@/components/orders/progress-modal'
import { useWorkerOrders } from '@/hooks/use-orders'
import { useAuth } from '@/hooks/use-auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Package, Clock, User, CheckCircle } from 'lucide-react'

export default function WorkerOrdersPage() {
  const { user, profile } = useAuth()
  const { availableOrders, myOrders, loading, error, refetch } = useWorkerOrders(user?.id || '')
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
    refetch()
  }

  // Estadísticas para el worker
  const myOrdersStats = {
    total: myOrders.length,
    en_proceso: myOrders.filter((o) => o.status === 'en_proceso').length,
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

        {/* Mis pedidos asignados */}
        {myOrders.length > 0 && (
          <div className='mb-8'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>Mis Pedidos Asignados</h2>
            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
              {myOrders.map((order) => (
                <WorkerOrderCard key={order.id} order={order} onUpdateProgress={openProgressModal} />
              ))}
            </div>
          </div>
        )}

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

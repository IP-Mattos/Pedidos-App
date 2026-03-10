'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Package,
  Check,
  Truck,
  User
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { MainLayout } from '@/components/layout/main-layout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/hooks/use-auth'
import { OrdersService } from '@/lib/services/order-services'
import { Order } from '@/types/database'
import toast from 'react-hot-toast'

const WorkerOrderPDFButton = dynamic(
  () => import('@/components/orders/order-pdf').then((m) => m.WorkerOrderPDFButton),
  { ssr: false, loading: () => null }
)

const METODO_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  credito: 'Crédito',
  dolares: 'Dólares',
  cheque: 'Cheque',
  transferencia: 'Transferencia',
}

export default function DeliveryOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { profile } = useAuth()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<'pagado' | 'entregado' | null>(null)

  const loadOrder = useCallback(async () => {
    try {
      const data = await OrdersService.getOrderById(id)
      setOrder(data as Order)
    } catch {
      toast.error('Error al cargar el pedido')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadOrder() }, [loadOrder])

  const handleUpdate = async (status: 'pagado' | 'entregado') => {
    if (!order) return
    setUpdating(status)
    try {
      await OrdersService.deliveryUpdateStatus(order.id, status)
      setOrder((prev) => prev ? { ...prev, status } : prev)
      toast.success(status === 'pagado' ? 'Marcado como pagado' : 'Marcado como entregado')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar')
    } finally {
      setUpdating(null)
    }
  }

  if (profile?.role !== 'delivery') {
    return (
      <MainLayout>
        <div className='max-w-3xl mx-auto py-6 px-4 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Acceso Denegado</h1>
        </div>
      </MainLayout>
    )
  }

  if (loading) return <MainLayout><LoadingSpinner message='Cargando pedido...' /></MainLayout>

  if (!order) {
    return (
      <MainLayout>
        <div className='max-w-3xl mx-auto py-6 px-4 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Pedido no encontrado</h1>
          <button onClick={() => router.back()} className='mt-4 text-blue-600 hover:underline'>Volver</button>
        </div>
      </MainLayout>
    )
  }

  const isCompletado = order.status === 'completado'
  const isDone = ['pagado', 'entregado'].includes(order.status)

  return (
    <MainLayout>
      <div className='max-w-3xl mx-auto py-6 px-4 sm:px-6'>
        {/* Back */}
        <button
          onClick={() => router.back()}
          className='flex items-center text-sm text-gray-500 hover:text-gray-800 mb-5'
        >
          <ArrowLeft className='h-4 w-4 mr-1' />
          Volver
        </button>

        {/* Header */}
        <div className='flex flex-wrap items-start justify-between gap-3 mb-6'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>{order.nombre_cliente}</h1>
            <p className='text-sm text-gray-400 mt-0.5'>#{order.id.slice(-8)}</p>
          </div>
          <div className='flex items-center gap-2'>
            {isDone && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                order.status === 'entregado' ? 'bg-green-200 text-green-900' : 'bg-blue-100 text-blue-800'
              }`}>
                <Check className='h-3.5 w-3.5 mr-1' />
                {order.status === 'entregado' ? 'Entregado' : 'Pagado'}
              </span>
            )}
            <WorkerOrderPDFButton order={order} />
          </div>
        </div>

        <div className='space-y-6'>
          {/* Info cliente */}
          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-base font-semibold text-gray-900 mb-4'>Información del cliente</h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {order.customer_phone && (
                <div className='flex items-start gap-3'>
                  <Phone className='h-5 w-5 text-gray-400 mt-0.5' />
                  <div>
                    <p className='text-xs text-gray-500'>Teléfono</p>
                    <p className='text-sm font-medium text-gray-900'>{order.customer_phone}</p>
                  </div>
                </div>
              )}
              {order.customer_address && (
                <div className='flex items-start gap-3'>
                  <MapPin className='h-5 w-5 text-gray-400 mt-0.5' />
                  <div>
                    <p className='text-xs text-gray-500'>Dirección</p>
                    <p className='text-sm font-medium text-gray-900'>{order.customer_address}</p>
                  </div>
                </div>
              )}
              <div className='flex items-start gap-3'>
                <Calendar className='h-5 w-5 text-gray-400 mt-0.5' />
                <div>
                  <p className='text-xs text-gray-500'>Fecha de entrega</p>
                  <p className='text-sm font-medium text-gray-900'>
                    {new Date(order.fecha_entrega).toLocaleDateString('es-UY', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <DollarSign className='h-5 w-5 text-gray-400 mt-0.5' />
                <div>
                  <p className='text-xs text-gray-500'>Pago</p>
                  <p className='text-sm font-medium text-gray-900'>
                    ${order.monto_total.toFixed(2)} — {METODO_LABELS[order.metodo_pago] ?? order.metodo_pago}
                  </p>
                  <span className={`text-xs font-medium ${order.esta_pagado ? 'text-green-600' : 'text-red-500'}`}>
                    {order.esta_pagado ? 'Ya pagado' : 'Pendiente de cobro'}
                  </span>
                </div>
              </div>
              {order.assignee && (
                <div className='flex items-start gap-3'>
                  <User className='h-5 w-5 text-gray-400 mt-0.5' />
                  <div>
                    <p className='text-xs text-gray-500'>Preparado por</p>
                    <p className='text-sm font-medium text-gray-900'>{order.assignee.full_name}</p>
                  </div>
                </div>
              )}
            </div>
            {order.notas && (
              <div className='mt-4 pt-4 border-t'>
                <p className='text-xs text-gray-500 mb-1'>Notas</p>
                <p className='text-sm text-gray-700'>{order.notas}</p>
              </div>
            )}
          </div>

          {/* Productos */}
          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-base font-semibold text-gray-900'>Productos</h2>
              <span className='text-sm text-gray-500'>{order.lista_productos.length} items</span>
            </div>
            <div className='divide-y'>
              {order.lista_productos.map((product, index) => (
                <div key={index} className='py-3 flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0'>
                      <Package className='w-3 h-3 text-green-600' />
                    </div>
                    <p className='text-sm font-medium text-gray-900'>{product.producto}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm text-gray-600'>x{product.cantidad}</p>
                    <p className='text-sm font-medium text-gray-900'>
                      ${(product.precio * product.cantidad).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className='mt-4 pt-4 border-t flex justify-between'>
              <span className='text-sm font-semibold text-gray-900'>Total</span>
              <span className='text-base font-bold text-gray-900'>${order.monto_total.toFixed(2)}</span>
            </div>
          </div>

          {/* Acciones (solo si está completado) */}
          {isCompletado && (
            <div className='bg-white shadow rounded-lg p-6'>
              <h2 className='text-base font-semibold text-gray-900 mb-4'>Confirmar entrega</h2>
              <div className='flex gap-3'>
                <button
                  onClick={() => handleUpdate('pagado')}
                  disabled={!!updating}
                  className='flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors'
                >
                  <DollarSign className='h-4 w-4' />
                  {updating === 'pagado' ? 'Procesando...' : 'Marcar como Pagado'}
                </button>
                <button
                  onClick={() => handleUpdate('entregado')}
                  disabled={!!updating}
                  className='flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors'
                >
                  <Truck className='h-4 w-4' />
                  {updating === 'entregado' ? 'Procesando...' : 'Marcar como Entregado'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

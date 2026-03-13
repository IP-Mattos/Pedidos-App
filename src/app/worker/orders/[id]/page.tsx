'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  User,
  Package,
  Clock,
  Check,
  AlertCircle,
  Timer,
  MessageSquare,
  AlertTriangle,
  Link2,
  MessageCircle
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { MainLayout } from '@/components/layout/main-layout'

const WorkerOrderPDFButton = dynamic(
  () => import('@/components/orders/order-pdf').then((m) => m.WorkerOrderPDFButton),
  { ssr: false, loading: () => null }
)
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/hooks/use-auth'
import { OrdersService } from '@/lib/services/order-services'
import { ProductProgressService, ProductProgress } from '@/lib/services/product-progress-services'
import { ProductChecklist } from '@/components/orders/product-checklist'
import { ProgressModal } from '@/components/orders/progress-modal'
import { Order, OrderProgress } from '@/types/database'
import toast from 'react-hot-toast'

function useElapsedTime(startISO: string | null | undefined, endISO?: string | null) {
  const [display, setDisplay] = useState('')
  useEffect(() => {
    if (!startISO) { setDisplay(''); return }
    const start = new Date(startISO).getTime()
    const end = endISO ? new Date(endISO).getTime() : null
    const format = (ms: number) => {
      const totalSeconds = Math.max(0, Math.floor(ms / 1000))
      const h = Math.floor(totalSeconds / 3600)
      const m = Math.floor((totalSeconds % 3600) / 60)
      const s = totalSeconds % 60
      return h > 0
        ? `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
        : `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
    }
    if (end) { setDisplay(format(end - start)); return }
    const tick = () => setDisplay(format(Date.now() - start))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startISO, endISO])
  return display
}

const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  completado: 'Completado',
  entregado: 'Entregado',
  cancelado: 'Cancelado'
}

export default function WorkerOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, profile } = useAuth()

  const [order, setOrder] = useState<Order | null>(null)
  const [progressHistory, setProgressHistory] = useState<OrderProgress[]>([])
  const [productProgress, setProductProgress] = useState<ProductProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [progressModalOpen, setProgressModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [orderData, history, products] = await Promise.all([
        OrdersService.getOrderById(id),
        OrdersService.getOrderProgress(id),
        ProductProgressService.getOrderProductProgress(id)
      ])
      setOrder(orderData as Order)
      setProgressHistory(history || [])
      setProductProgress(products)
    } catch {
      toast.error('Error al cargar el pedido')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  // Hooks siempre al top — antes de cualquier early return
  const isDone = order ? ['completado', 'entregado'].includes(order.status) : false
  const elapsed = useElapsedTime(order?.assigned_at, isDone ? order?.updated_at : null)

  if (profile?.role !== 'worker') {
    return (
      <MainLayout>
        <div className='max-w-4xl mx-auto py-6 px-4 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Acceso Denegado</h1>
        </div>
      </MainLayout>
    )
  }

  if (loading) {
    return <MainLayout><LoadingSpinner message='Cargando pedido...' /></MainLayout>
  }

  if (!order) {
    return (
      <MainLayout>
        <div className='max-w-4xl mx-auto py-6 px-4 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Pedido no encontrado</h1>
          <button onClick={() => router.back()} className='mt-4 text-blue-600 hover:underline'>Volver</button>
        </div>
      </MainLayout>
    )
  }

  const isAssignedToMe = order.assigned_to === user?.id
  const completedProducts = productProgress.filter((p) => p.is_completed).length
  const totalProducts = productProgress.length

  const handleCopyLink = () => {
    const url = `${window.location.origin}/track/${id}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado')
  }

  const handleShareWhatsApp = () => {
    const url = `${window.location.origin}/track/${id}`
    const phone = order.customer_phone
    const msg = `Hola ${order.nombre_cliente}, podés seguir el progreso de tu pedido acá: ${url}`
    const waUrl = phone
      ? `https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '598')}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(waUrl, '_blank')
  }

  const statusColor: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-800',
    en_proceso: 'bg-blue-100 text-blue-800',
    completado: 'bg-green-100 text-green-800',
    entregado: 'bg-green-200 text-green-900',
    cancelado: 'bg-red-100 text-red-800'
  }

  return (
    <MainLayout>
      <div className='max-w-3xl mx-auto py-6 px-4 sm:px-6'>
        {/* Back */}
        <button
          onClick={() => router.push('/worker/orders')}
          className='flex items-center text-sm text-gray-500 hover:text-gray-800 mb-5'
        >
          <ArrowLeft className='h-4 w-4 mr-1' />
          Volver a pedidos
        </button>

        {/* Header */}
        <div className='flex flex-wrap items-start justify-between gap-3 mb-6'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>{order.nombre_cliente}</h1>
            <p className='text-sm text-gray-400 mt-0.5'>#{order.id.slice(-8)}</p>
          </div>
          <div className='flex items-center gap-2 flex-wrap'>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor[order.status] ?? 'bg-gray-100 text-gray-800'}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
            <button
              onClick={handleCopyLink}
              title='Copiar link de seguimiento'
              className='inline-flex items-center px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50'
            >
              <Link2 className='h-4 w-4 mr-1.5' />
              Link
            </button>
            <button
              onClick={handleShareWhatsApp}
              title='Enviar link por WhatsApp'
              className='inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700'
            >
              <MessageCircle className='h-4 w-4 mr-1.5' />
              WhatsApp
            </button>
            <WorkerOrderPDFButton order={order} />
            {isAssignedToMe && !isDone && order.status !== 'cancelado' && (
              <button
                onClick={() => setProgressModalOpen(true)}
                className='inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700'
              >
                <MessageSquare className='h-4 w-4 mr-1.5' />
                Actualizar
              </button>
            )}
          </div>
        </div>

        {/* Timer */}
        {order.assigned_at && elapsed && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium mb-6 ${
            isDone ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <Timer className='h-4 w-4 flex-shrink-0' />
            <span>{isDone ? 'Duración total:' : 'Tiempo transcurrido:'}</span>
            <span className='font-mono font-bold ml-auto'>{elapsed}</span>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Columna principal */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Info */}
            <div className='bg-white shadow rounded-lg p-6'>
              <h2 className='text-base font-semibold text-gray-900 mb-4'>Información del pedido</h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
                      ${order.monto_total.toFixed(2)} — {order.metodo_pago}
                    </p>
                    <span className={`text-xs font-medium ${order.esta_pagado ? 'text-green-600' : 'text-red-500'}`}>
                      {order.esta_pagado ? 'Pagado' : 'Pendiente de pago'}
                    </span>
                  </div>
                </div>
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
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer_address)}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1'
                      >
                        <MapPin className='h-3 w-3' />
                        Ver en mapa
                      </a>
                    </div>
                  </div>
                )}
                {order.creator && (
                  <div className='flex items-start gap-3'>
                    <User className='h-5 w-5 text-gray-400 mt-0.5' />
                    <div>
                      <p className='text-xs text-gray-500'>Creado por</p>
                      <p className='text-sm font-medium text-gray-900'>{order.creator.full_name}</p>
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

            {/* Productos / Checklist */}
            <div className='bg-white shadow rounded-lg p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-base font-semibold text-gray-900'>Productos</h2>
                {totalProducts > 0 && (
                  <span className='text-sm text-gray-500'>{completedProducts}/{totalProducts} conseguidos</span>
                )}
              </div>

              {isAssignedToMe && order.status !== 'cancelado' ? (
                <ProductChecklist
                  orderId={order.id}
                  products={order.lista_productos}
                  isReadOnly={isDone}
                />
              ) : (
                <div className='divide-y'>
                  {order.lista_productos.map((product, index) => {
                    const prog = productProgress.find((p) => p.product_index === index)
                    const esFalta = !!prog?.notes?.startsWith('FALTA:')
                    const faltaReason = esFalta ? prog!.notes!.replace('FALTA:', '').trim() : null
                    return (
                      <div key={index} className={`py-3 flex items-center justify-between ${esFalta ? 'bg-red-50 -mx-6 px-6' : ''}`}>
                        <div className='flex items-center gap-3'>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            esFalta ? 'bg-red-100' : prog?.is_completed ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {esFalta ? <AlertTriangle className='w-3 h-3 text-red-500' /> :
                              prog?.is_completed ? <Check className='w-3 h-3 text-green-600' /> :
                              <Clock className='w-3 h-3 text-gray-400' />}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${esFalta ? 'text-red-800' : 'text-gray-900'}`}>
                              {product.producto}
                            </p>
                            {esFalta && faltaReason && (
                              <p className='text-xs text-red-500 italic'>Falta: {faltaReason}</p>
                            )}
                          </div>
                        </div>
                        <p className='text-sm text-gray-600'>x{product.cantidad}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Historial */}
          <div className='bg-white shadow rounded-lg p-6 h-fit'>
            <h2 className='text-base font-semibold text-gray-900 mb-4'>Historial</h2>
            {progressHistory.length === 0 ? (
              <p className='text-sm text-gray-400 text-center py-4'>Sin actualizaciones aún</p>
            ) : (
              <ol className='relative border-l border-gray-200 space-y-4 ml-2'>
                {progressHistory.map((entry) => {
                  const colors: Record<string, string> = {
                    en_proceso: 'bg-blue-100',
                    completado: 'bg-green-100',
                    entregado: 'bg-green-200',
                    cancelado: 'bg-red-100',
                    pendiente: 'bg-yellow-100'
                  }
                  return (
                    <li key={entry.id} className='ml-4'>
                      <span className={`absolute -left-1.5 mt-1 flex h-3 w-3 items-center justify-center rounded-full ring-2 ring-white ${colors[entry.status] ?? 'bg-gray-100'}`} />
                      <div>
                        <p className='text-sm font-medium text-gray-800'>{STATUS_LABEL[entry.status] ?? entry.status}</p>
                        {entry.notes && (
                          <p className='text-xs text-gray-600 mt-0.5 italic'>"{entry.notes}"</p>
                        )}
                        <p className='text-xs text-gray-400 mt-0.5'>
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </div>

        {/* Modal de progreso */}
        {progressModalOpen && (
          <ProgressModal
            orderId={order.id}
            currentStatus={order.status}
            onClose={() => setProgressModalOpen(false)}
            onUpdate={() => {
              setProgressModalOpen(false)
              loadData()
            }}
          />
        )}
      </div>
    </MainLayout>
  )
}

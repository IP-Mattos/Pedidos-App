'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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
  UserCheck,
  Pencil,
  Timer,
  AlertTriangle
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { MainLayout } from '@/components/layout/main-layout'

const OrderPDFButton = dynamic(
  () => import('@/components/orders/order-pdf').then((m) => m.OrderPDFButton),
  { ssr: false, loading: () => <span className='text-xs text-gray-400'>Cargando PDF...</span> }
)
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/hooks/use-auth'
import { OrdersService } from '@/lib/services/order-services'
import { ProfileService } from '@/lib/services/profile-services'
import { ProductProgressService, ProductProgress } from '@/lib/services/product-progress-services'
import { Order, OrderProgress, Profile } from '@/types/database'
import toast from 'react-hot-toast'

// ─── Timer hook ────────────────────────────────────────────────────────────────
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

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: typeof Clock; label: string }> = {
  pendiente: { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock, label: 'Pendiente' },
  en_proceso: { color: 'text-blue-700', bg: 'bg-blue-100', icon: Package, label: 'En Proceso' },
  completado: { color: 'text-green-700', bg: 'bg-green-100', icon: Check, label: 'Completado' },
  pagado: { color: 'text-blue-800', bg: 'bg-blue-100', icon: Check, label: 'Pagado' },
  entregado: { color: 'text-green-800', bg: 'bg-green-200', icon: Check, label: 'Entregado' },
  cancelado: { color: 'text-red-700', bg: 'bg-red-100', icon: AlertCircle, label: 'Cancelado' }
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { profile } = useAuth()

  const [order, setOrder] = useState<Order | null>(null)
  const [progressHistory, setProgressHistory] = useState<OrderProgress[]>([])
  const [productProgress, setProductProgress] = useState<ProductProgress[]>([])
  const [workers, setWorkers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [orderData, history, products, workerList] = await Promise.all([
        OrdersService.getOrderById(id),
        OrdersService.getOrderProgress(id),
        ProductProgressService.getOrderProductProgress(id),
        ProfileService.getWorkers()
      ])
      setOrder(orderData as Order)
      setProgressHistory(history || [])
      setProductProgress(products)
      setWorkers(workerList)
    } catch {
      toast.error('Error al cargar el pedido')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return
    if (newStatus === 'cancelado') {
      setPendingStatus(newStatus)
      return
    }
    applyStatusChange(newStatus)
  }

  const applyStatusChange = async (newStatus: string) => {
    if (!order) return
    setPendingStatus(null)
    setIsUpdatingStatus(true)
    try {
      await OrdersService.updateOrderStatus(order.id, newStatus)
      setOrder((prev) => (prev ? { ...prev, status: newStatus as Order['status'] } : prev))
      toast.success('Estado actualizado')
    } catch {
      toast.error('Error al actualizar estado')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleAssign = async (workerId: string) => {
    if (!order) return
    setIsAssigning(true)
    try {
      await OrdersService.adminAssignOrder(order.id, workerId === '' ? null : workerId)
      const worker = workers.find((w) => w.id === workerId)
      setOrder((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          assigned_to: workerId || null,
          assigned_at: workerId ? new Date().toISOString() : null,
          status: workerId ? 'en_proceso' : ('pendiente' as Order['status']),
          assignee: worker ? { ...worker } : undefined
        }
      })
      toast.success(workerId ? `Asignado a ${worker?.full_name}` : 'Asignación removida')
    } catch {
      toast.error('Error al asignar pedido')
    } finally {
      setIsAssigning(false)
    }
  }

  const isDone = order ? ['completado', 'entregado'].includes(order.status) : false
  const elapsed = useElapsedTime(order?.assigned_at, isDone ? order?.updated_at : null)

  if (profile?.role !== 'admin') {
    return (
      <MainLayout>
        <div className='max-w-4xl mx-auto py-6 px-4 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Acceso Denegado</h1>
        </div>
      </MainLayout>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner message='Cargando pedido...' />
      </MainLayout>
    )
  }

  if (!order) {
    return (
      <MainLayout>
        <div className='max-w-4xl mx-auto py-6 px-4 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Pedido no encontrado</h1>
          <button onClick={() => router.back()} className='mt-4 text-blue-600 hover:underline'>
            Volver
          </button>
        </div>
      </MainLayout>
    )
  }

  const statusConf = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pendiente
  const StatusIcon = statusConf.icon
  const completedProducts = productProgress.filter((p) => p.is_completed).length
  const totalProducts = productProgress.length

  return (
    <MainLayout>
      <div className='max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        {/* Confirm cancel modal */}
        {pendingStatus === 'cancelado' && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
            <div className='bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4'>
              <div className='flex items-center gap-3 mb-4'>
                <AlertCircle className='h-6 w-6 text-red-500 flex-shrink-0' />
                <h3 className='text-base font-semibold text-gray-900'>¿Cancelar este pedido?</h3>
              </div>
              <p className='text-sm text-gray-500 mb-6'>
                Esta acción cambiará el estado a <strong>Cancelado</strong>. Podés revertirlo luego si es necesario.
              </p>
              <div className='flex justify-end gap-3'>
                <button
                  onClick={() => setPendingStatus(null)}
                  className='px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
                >
                  No, volver
                </button>
                <button
                  onClick={() => applyStatusChange('cancelado')}
                  className='px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700'
                >
                  Sí, cancelar pedido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back + header */}
        <div className='mb-6'>
          <button
            onClick={() => router.push('/admin/orders')}
            className='flex items-center text-sm text-gray-500 hover:text-gray-800 mb-4'
          >
            <ArrowLeft className='h-4 w-4 mr-1' />
            Volver a pedidos
          </button>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>{order.nombre_cliente}</h1>
              <p className='text-sm text-gray-500 mt-1'>ID: {order.id}</p>
            </div>
            <div className='flex items-center gap-3 flex-wrap'>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConf.bg} ${statusConf.color}`}
              >
                <StatusIcon className='w-4 h-4 mr-1.5' />
                {statusConf.label}
              </span>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdatingStatus}
                className='text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50'
              >
                <option value='pendiente'>Pendiente</option>
                <option value='en_proceso'>En Proceso</option>
                <option value='completado'>Completado</option>
                <option value='pagado'>Pagado</option>
                <option value='entregado'>Entregado</option>
                <option value='cancelado'>Cancelado</option>
              </select>
              <OrderPDFButton order={order} />
              <Link
                href={`/admin/orders/${id}/edit`}
                className='inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
              >
                <Pencil className='h-4 w-4 mr-1.5' />
                Editar
              </Link>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Columna principal */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Info del pedido */}
            <div className='bg-white shadow rounded-lg p-6'>
              <h2 className='text-base font-semibold text-gray-900 mb-4'>Información del pedido</h2>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='flex items-start gap-3'>
                  <Calendar className='h-5 w-5 text-gray-400 mt-0.5' />
                  <div>
                    <p className='text-xs text-gray-500'>Fecha de entrega</p>
                    <p className='text-sm font-medium text-gray-900'>
                      {new Date(order.fecha_entrega).toLocaleDateString('es-UY', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
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
                    </div>
                  </div>
                )}

                <div className='flex items-start gap-3'>
                  <User className='h-5 w-5 text-gray-400 mt-0.5' />
                  <div>
                    <p className='text-xs text-gray-500'>Creado por</p>
                    <p className='text-sm font-medium text-gray-900'>{order.creator?.full_name ?? '—'}</p>
                    <p className='text-xs text-gray-400'>{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {/* Asignación editable */}
                <div className='flex items-start gap-3'>
                  <UserCheck className='h-5 w-5 text-gray-400 mt-0.5' />
                  <div className='flex-1'>
                    <p className='text-xs text-gray-500 mb-1'>Asignado a</p>
                    <select
                      value={order.assigned_to ?? ''}
                      onChange={(e) => handleAssign(e.target.value)}
                      disabled={isAssigning}
                      className='w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
                    >
                      <option value=''>Sin asignar</option>
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.full_name}
                        </option>
                      ))}
                    </select>
                    {order.assigned_at && (
                      <p className='text-xs text-gray-400 mt-1'>{new Date(order.assigned_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>
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
                {totalProducts > 0 && (
                  <span className='text-sm text-gray-500'>
                    {completedProducts}/{totalProducts} conseguidos
                  </span>
                )}
              </div>

              <div className='divide-y'>
                {order.lista_productos.map((product, index) => {
                  const prog = productProgress.find((p) => p.product_index === index)
                  const esFalta = !!prog?.notes?.startsWith('FALTA:')
                  const faltaReason = esFalta ? prog!.notes!.replace('FALTA:', '').trim() : null
                  return (
                    <div key={index} className={`py-3 flex items-center justify-between ${esFalta ? 'bg-red-50 -mx-6 px-6' : ''}`}>
                      <div className='flex items-center gap-3'>
                        {prog ? (
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                              esFalta ? 'bg-red-100' : prog.is_completed ? 'bg-green-100' : 'bg-gray-100'
                            }`}
                          >
                            {esFalta ? (
                              <AlertTriangle className='w-3 h-3 text-red-500' />
                            ) : prog.is_completed ? (
                              <Check className='w-3 h-3 text-green-600' />
                            ) : (
                              <Clock className='w-3 h-3 text-gray-400' />
                            )}
                          </div>
                        ) : (
                          <div className='w-5 h-5 rounded-full bg-gray-100 flex-shrink-0' />
                        )}
                        <div>
                          <p className={`text-sm font-medium ${esFalta ? 'text-red-800' : 'text-gray-900'}`}>
                            {product.producto}
                          </p>
                          {esFalta && faltaReason && (
                            <p className='text-xs text-red-500 italic'>Falta: {faltaReason}</p>
                          )}
                          {prog && !prog.is_completed && !esFalta && (
                            <p className='text-xs text-gray-400'>
                              {prog.cantidad_completada}/{product.cantidad} unidades
                            </p>
                          )}
                        </div>
                      </div>
                      <div className='flex items-center gap-3'>
                        {esFalta && (
                          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700'>
                            <AlertTriangle className='w-3 h-3' /> Falta
                          </span>
                        )}
                        <div className='text-right'>
                          <p className='text-sm text-gray-600'>x{product.cantidad}</p>
                          <p className='text-sm font-medium text-gray-900'>
                            ${(product.precio * product.cantidad).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className='mt-4 pt-4 border-t flex justify-between'>
                <span className='text-sm font-semibold text-gray-900'>Total</span>
                <span className='text-sm font-semibold text-gray-900'>${order.monto_total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Columna lateral — historial */}
          <div className='space-y-6'>
            {/* Timer */}
            {order.assigned_at && elapsed && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                isDone
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                <Timer className='h-4 w-4 flex-shrink-0' />
                <span>{isDone ? 'Duración total:' : 'Tiempo trabajando:'}</span>
                <span className='font-mono font-bold ml-auto'>{elapsed}</span>
              </div>
            )}

            <div className='bg-white shadow rounded-lg p-6'>
              <h2 className='text-base font-semibold text-gray-900 mb-4'>Historial de progreso</h2>

              {progressHistory.length === 0 ? (
                <p className='text-sm text-gray-400 text-center py-4'>Sin actualizaciones aún</p>
              ) : (
                <ol className='relative border-l border-gray-200 space-y-4 ml-2'>
                  {progressHistory.map((entry) => {
                    const conf = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.pendiente
                    const EntryIcon = conf.icon
                    return (
                      <li key={entry.id} className='ml-4'>
                        <span
                          className={`absolute -left-1.5 mt-1 flex h-3 w-3 items-center justify-center rounded-full ring-2 ring-white ${conf.bg}`}
                        />
                        <div className='flex items-start gap-2'>
                          <EntryIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${conf.color}`} />
                          <div>
                            <p className='text-sm font-medium text-gray-800'>{conf.label}</p>
                            {entry.worker && <p className='text-xs text-gray-500'>{entry.worker.full_name}</p>}
                            {entry.notes && (
                              <p className='text-xs text-gray-600 mt-0.5 italic'>"{entry.notes}"</p>
                            )}
                            <p className='text-xs text-gray-400 mt-0.5'>
                              {new Date(entry.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

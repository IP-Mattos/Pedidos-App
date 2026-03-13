'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Check, Clock, Package, Truck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProductProgressService, ProductProgress } from '@/lib/services/product-progress-services'

// ─── Types ──────────────────────────────────────────────────────────────────

interface TrackOrder {
  id: string
  nombre_cliente: string
  fecha_entrega: string
  status: string
  lista_productos: { producto: string; cantidad: number; precio: number }[]
  notas?: string | null
  assignee?: { full_name: string } | null
  assigned_at?: string | null
}

// ─── Step config ─────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'pendiente', label: 'Recibido', icon: Clock },
  { key: 'en_proceso', label: 'En preparación', icon: Package },
  { key: 'completado', label: 'Listo', icon: CheckCircle2 },
  { key: 'entregado', label: 'Entregado', icon: Truck },
]

const STEP_INDEX: Record<string, number> = {
  pendiente: 0,
  en_proceso: 1,
  completado: 2,
  pagado: 2,
  entregado: 3,
}

const STATUS_MSG: Record<string, { title: string; sub: string; color: string }> = {
  pendiente: { title: 'Pedido recibido', sub: 'Estamos revisando tu pedido.', color: 'text-yellow-700' },
  en_proceso: { title: 'En preparación', sub: 'Tu pedido está siendo preparado.', color: 'text-blue-700' },
  completado: { title: '¡Listo para entregar!', sub: 'Tu pedido está completo y listo.', color: 'text-green-700' },
  pagado: { title: '¡Listo para entregar!', sub: 'Tu pedido está completo y listo.', color: 'text-green-700' },
  entregado: { title: '¡Entregado!', sub: 'Tu pedido fue entregado. ¡Gracias!', color: 'text-green-800' },
  cancelado: { title: 'Pedido cancelado', sub: 'Este pedido fue cancelado. Contactá al local para más info.', color: 'text-red-700' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrackOrderPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<TrackOrder | null>(null)
  const [progress, setProgress] = useState<ProductProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const fetchOrder = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('id, nombre_cliente, fecha_entrega, status, lista_productos, notas, assigned_at, assignee:assigned_to(full_name)')
      .eq('id', id)
      .single()

    if (error || !data) { setNotFound(true); setLoading(false); return }
    const raw = data as any
    const productos = typeof raw.lista_productos === 'string'
      ? JSON.parse(raw.lista_productos)
      : raw.lista_productos ?? []
    setOrder({ ...raw, lista_productos: productos } as TrackOrder)
  }, [id])

  const fetchProgress = useCallback(async () => {
    const data = await ProductProgressService.getOrderProductProgress(id)
    setProgress(data)
  }, [id])

  useEffect(() => {
    Promise.all([fetchOrder(), fetchProgress()]).finally(() => setLoading(false))
  }, [fetchOrder, fetchProgress])

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient()

    const orderSub = supabase
      .channel(`track-order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, () => {
        fetchOrder()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_product_progress', filter: `order_id=eq.${id}` }, () => {
        fetchProgress()
      })
      .subscribe()

    return () => { supabase.removeChannel(orderSub) }
  }, [id, fetchOrder, fetchProgress])

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto' />
          <p className='mt-3 text-sm text-gray-500'>Cargando tu pedido...</p>
        </div>
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
        <div className='text-center'>
          <XCircle className='h-12 w-12 text-gray-400 mx-auto' />
          <h1 className='mt-4 text-xl font-semibold text-gray-900'>Pedido no encontrado</h1>
          <p className='mt-2 text-sm text-gray-500'>El link puede ser incorrecto o el pedido ya no está disponible.</p>
        </div>
      </div>
    )
  }

  const isCancelled = order.status === 'cancelado'
  const stepIndex = isCancelled ? -1 : (STEP_INDEX[order.status] ?? 0)
  const statusMsg = STATUS_MSG[order.status] ?? STATUS_MSG.pendiente
  const overallProgress = progress.length === 0 ? 0 : Math.round((progress.filter((p) => p.is_completed).length / progress.length) * 100)
  const faltantes = progress.filter((p) => !!p.notes?.startsWith('FALTA:'))

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b'>
        <div className='max-w-lg mx-auto px-4 py-4 flex items-center gap-3'>
          <Package className='h-6 w-6 text-blue-600' />
          <span className='font-semibold text-gray-800'>Seguimiento de pedido</span>
        </div>
      </div>

      <div className='max-w-lg mx-auto px-4 py-6 space-y-4'>

        {/* Greeting card */}
        <div className='bg-white rounded-2xl shadow-sm p-5'>
          <p className='text-sm text-gray-500'>Hola,</p>
          <h1 className='text-xl font-bold text-gray-900 mt-0.5'>{order.nombre_cliente}</h1>
          <p className={`mt-2 text-sm font-medium ${statusMsg.color}`}>{statusMsg.title}</p>
          <p className='text-xs text-gray-500 mt-0.5'>{statusMsg.sub}</p>

          {order.assignee && order.status === 'en_proceso' && (
            <p className='mt-3 text-xs text-gray-500'>
              A cargo de <span className='font-semibold text-gray-700'>{order.assignee.full_name}</span>
            </p>
          )}

          <div className='mt-3 flex items-center gap-2 text-xs text-gray-500'>
            <Clock className='h-3.5 w-3.5' />
            <span>
              Entrega: <span className='font-medium text-gray-700'>
                {new Date(order.fecha_entrega).toLocaleDateString('es-UY', {
                  weekday: 'long', day: 'numeric', month: 'long'
                })}
              </span>
            </span>
          </div>
        </div>

        {/* Step indicator */}
        {!isCancelled ? (
          <div className='bg-white rounded-2xl shadow-sm p-5'>
            <div className='flex items-center justify-between'>
              {STEPS.map((step, i) => {
                const done = i < stepIndex
                const active = i === stepIndex
                const Icon = step.icon
                return (
                  <div key={step.key} className='flex-1 flex flex-col items-center gap-1 relative'>
                    {/* Connector line */}
                    {i < STEPS.length - 1 && (
                      <div
                        className={`absolute top-4 left-1/2 w-full h-0.5 ${done || active ? 'bg-blue-500' : 'bg-gray-200'}`}
                        style={{ left: '50%' }}
                      />
                    )}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        done
                          ? 'bg-blue-600 text-white'
                          : active
                          ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {done ? <Check className='h-4 w-4' /> : <Icon className='h-4 w-4' />}
                    </div>
                    <span className={`text-xs text-center leading-tight ${active ? 'font-semibold text-blue-700' : done ? 'text-gray-600' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className='bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3'>
            <XCircle className='h-5 w-5 text-red-500 flex-shrink-0' />
            <p className='text-sm text-red-700 font-medium'>Este pedido fue cancelado</p>
          </div>
        )}

        {/* Progress bar (if in process) */}
        {order.status === 'en_proceso' && progress.length > 0 && (
          <div className='bg-white rounded-2xl shadow-sm p-5'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-gray-700'>Productos preparados</span>
              <span className='text-sm font-semibold text-gray-900'>{overallProgress}%</span>
            </div>
            <div className='w-full bg-gray-100 rounded-full h-2.5'>
              <div
                className='bg-blue-500 h-2.5 rounded-full transition-all duration-500'
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            {faltantes.length > 0 && (
              <div className='mt-3 flex items-start gap-2 bg-red-50 rounded-lg p-3'>
                <AlertTriangle className='h-4 w-4 text-red-500 flex-shrink-0 mt-0.5' />
                <div className='text-xs text-red-700'>
                  <span className='font-semibold'>{faltantes.length} producto{faltantes.length > 1 ? 's' : ''} no disponible{faltantes.length > 1 ? 's' : ''}.</span>
                  <span className='ml-1'>El local se pondrá en contacto con vos.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products */}
        <div className='bg-white rounded-2xl shadow-sm p-5'>
          <h2 className='text-sm font-semibold text-gray-800 mb-3'>Tu pedido</h2>
          <div className='space-y-2'>
            {order.lista_productos.map((product, index) => {
              const prog = progress.find((p) => p.product_index === index)
              const esFalta = !!prog?.notes?.startsWith('FALTA:')
              const isCompleted = prog?.is_completed ?? false

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-2.5 rounded-lg ${
                    isCompleted ? 'bg-green-50' : esFalta ? 'bg-red-50' : 'bg-gray-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? 'bg-green-500' : esFalta ? 'bg-red-400' : 'bg-gray-300'
                  }`}>
                    {isCompleted ? (
                      <Check className='h-3.5 w-3.5 text-white' />
                    ) : esFalta ? (
                      <AlertTriangle className='h-3 w-3 text-white' />
                    ) : (
                      <Clock className='h-3 w-3 text-white' />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className={`text-sm font-medium truncate ${
                      isCompleted ? 'text-green-800' : esFalta ? 'text-red-700 line-through' : 'text-gray-700'
                    }`}>
                      {product.producto}
                    </p>
                    {esFalta && (
                      <p className='text-xs text-red-500'>No disponible</p>
                    )}
                  </div>
                  <span className='text-xs text-gray-500 flex-shrink-0'>x{product.cantidad}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notas */}
        {order.notas && (
          <div className='bg-white rounded-2xl shadow-sm p-5'>
            <p className='text-xs text-gray-500 mb-1'>Notas del pedido</p>
            <p className='text-sm text-gray-700'>{order.notas}</p>
          </div>
        )}

        <p className='text-center text-xs text-gray-400 pb-4'>
          Esta página se actualiza automáticamente
        </p>
      </div>
    </div>
  )
}

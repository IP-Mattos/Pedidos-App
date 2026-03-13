'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  DollarSign,
  Package,
  User,
  MapPin,
  Phone,
  Clock,
  AlertCircle,
  UserCheck,
  Play,
  RefreshCw,
  Timer,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { Order } from '@/types/database'
import { OrdersService } from '@/lib/services/order-services'
import { useAuth } from '@/hooks/use-auth'
import toast from 'react-hot-toast'
import { ProductChecklist } from './product-checklist'

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

    if (end) {
      setDisplay(format(end - start))
      return
    }

    const tick = () => setDisplay(format(Date.now() - start))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startISO, endISO])

  return display
}

// ─── Component ─────────────────────────────────────────────────────────────────
interface WorkerOrderCardProps {
  order: Order
  onTaken?: () => void
  canTake?: boolean
}

export function WorkerOrderCard({ order, onTaken, canTake = true }: WorkerOrderCardProps) {
  const [isAssigning, setIsAssigning] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const { user } = useAuth()

  const isDone = ['completado', 'entregado'].includes(order.status)
  const elapsed = useElapsedTime(
    order.assigned_at,
    isDone ? order.updated_at : null
  )

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pendiente':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, text: 'Disponible para tomar' }
      case 'en_proceso':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Package, text: 'En Proceso' }
      case 'completado':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: UserCheck, text: 'Completado' }
      case 'entregado':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: UserCheck, text: 'Entregado' }
      case 'cancelado':
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, text: 'Cancelado' }
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock, text: status }
    }
  }

  const handleTakeOrder = async () => {
    if (!user) return
    setIsAssigning(true)
    try {
      await OrdersService.assignOrderToWorker(order.id, user.id)
      toast.success('¡Pedido asignado exitosamente!')
      onTaken?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al tomar el pedido')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleReleaseOrder = async () => {
    setIsReleasing(true)
    try {
      await OrdersService.releaseOrder(order.id)
      toast.success('Pedido liberado exitosamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al liberar el pedido')
    } finally {
      setIsReleasing(false)
    }
  }

  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon
  const isAssignedToMe = order.assigned_to === user?.id
  const isAvailable = order.status === 'pendiente' && !order.assigned_to
  const isAssignedToOther = order.assigned_to && order.assigned_to !== user?.id

  return (
    <div
      className={`bg-white rounded-lg shadow-md border-2 p-6 hover:shadow-lg transition-all ${
        isAssignedToMe
          ? 'border-blue-300 bg-blue-50'
          : isAvailable
          ? 'border-green-300 hover:border-green-400'
          : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <div className='flex items-start justify-between mb-4'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>{order.nombre_cliente}</h3>
          <p className='text-sm text-gray-500'>#{order.id.slice(-8)}</p>
        </div>
        <div className='flex flex-col items-end gap-1.5'>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
            <StatusIcon className='w-3 h-3 mr-1' />
            {statusConfig.text}
          </span>

          {isAssignedToMe && (
            <span className='inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800'>
              <User className='w-3 h-3 mr-1' />
              Asignado a ti
            </span>
          )}

          {isAssignedToOther && order.assignee && (
            <span className='inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800'>
              <User className='w-3 h-3 mr-1' />
              {order.assignee.full_name}
            </span>
          )}
        </div>
      </div>

      {/* Timer — solo si hay assigned_at */}
      {order.assigned_at && elapsed && (
        <div className={`mb-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
          isDone ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <Timer className='h-4 w-4 flex-shrink-0' />
          <span>{isDone ? 'Duración total:' : 'Tiempo transcurrido:'}</span>
          <span className='font-mono font-bold'>{elapsed}</span>
        </div>
      )}

      {/* Info */}
      <div className='space-y-1.5 mb-4'>
        <div className='flex items-center text-sm text-gray-600'>
          <Calendar className='w-4 h-4 mr-2 flex-shrink-0' />
          <span>Entrega: {new Date(order.fecha_entrega).toLocaleDateString()}</span>
        </div>
        <div className='flex items-center text-sm text-gray-600'>
          <DollarSign className='w-4 h-4 mr-2 flex-shrink-0' />
          <span>
            ${order.monto_total.toFixed(2)} — {order.metodo_pago}
            {order.esta_pagado && (
              <span className='ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                Pagado
              </span>
            )}
          </span>
        </div>
        {order.customer_phone && (
          <div className='flex items-center text-sm text-gray-600'>
            <Phone className='w-4 h-4 mr-2 flex-shrink-0' />
            <span>{order.customer_phone}</span>
          </div>
        )}
        {order.customer_address && (
          <div className='flex items-center text-sm text-gray-600'>
            <MapPin className='w-4 h-4 mr-2 flex-shrink-0' />
            <span>{order.customer_address}</span>
          </div>
        )}
        {order.creator && (
          <div className='flex items-center text-sm text-gray-600'>
            <User className='w-4 h-4 mr-2 flex-shrink-0' />
            <span>Creado por: {order.creator.full_name}</span>
          </div>
        )}
      </div>

      {/* Checklist editable para el worker asignado */}
      {isAssignedToMe && order.status !== 'cancelado' && (
        <div className='border-t pt-4 mb-4'>
          <ProductChecklist
            orderId={order.id}
            products={order.lista_productos}
            isReadOnly={isDone}
          />
        </div>
      )}

      {/* Productos (solo lectura para pedidos no asignados a mí) */}
      {!isAssignedToMe && (
        <div className='border-t pt-4 mb-4'>
          <h4 className='text-sm font-medium text-gray-900 mb-2'>Productos:</h4>
          <div className='space-y-1'>
            {order.lista_productos.map((product, index) => (
              <div key={index} className='flex justify-between text-sm'>
                <span>{product.producto} x{product.cantidad}</span>
                <span>${(product.precio * product.cantidad).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notas */}
      {order.notas && (
        <div className='border-t pt-4 mb-4'>
          <h4 className='text-sm font-medium text-gray-900 mb-1'>Notas:</h4>
          <p className='text-sm text-gray-600'>{order.notas}</p>
        </div>
      )}

      {/* Acciones */}
      <div className='border-t pt-4'>
        {isAvailable && (
          canTake ? (
            <button
              onClick={handleTakeOrder}
              disabled={isAssigning}
              className='w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {isAssigning ? (
                <><div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2' />Tomando pedido...</>
              ) : (
                <><Play className='w-4 h-4 mr-2' />Tomar este pedido</>
              )}
            </button>
          ) : (
            <div className='w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-400 rounded-md text-sm cursor-not-allowed'>
              <AlertCircle className='w-4 h-4 mr-2' />
              Ya tenés un pedido activo
            </div>
          )
        )}

        {isAssignedToMe && order.status === 'en_proceso' && (
          <button
            onClick={handleReleaseOrder}
            disabled={isReleasing}
            className='mt-2 w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50'
          >
            {isReleasing
              ? <><div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2' />Liberando...</>
              : <><RefreshCw className='w-4 h-4 mr-2' />Liberar Pedido</>
            }
          </button>
        )}

        {(isAssignedToOther || isDone || order.status === 'cancelado') && (
          <p className='text-center text-sm text-gray-500 py-2'>
            {isAssignedToOther ? 'Pedido asignado a otro trabajador' :
             order.status === 'entregado' ? 'Pedido entregado' :
             order.status === 'completado' ? 'Pedido completado' : 'Pedido cancelado'}
          </p>
        )}

        <Link
          href={`/worker/orders/${order.id}`}
          className='mt-2 w-full flex items-center justify-center px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors'
        >
          <ExternalLink className='w-3.5 h-3.5 mr-1.5' />
          Ver detalle
        </Link>
      </div>
    </div>
  )
}

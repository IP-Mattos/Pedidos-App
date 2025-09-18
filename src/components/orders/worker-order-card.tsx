'use client'

import { useState } from 'react'
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
  MessageSquare,
  RefreshCw
} from 'lucide-react'
import { Order } from '@/types/database'
import { OrdersService } from '@/lib/services/order-services'
import { useAuth } from '@/hooks/use-auth'
import toast from 'react-hot-toast'

interface WorkerOrderCardProps {
  order: Order
  onUpdateProgress?: (orderId: string, currentStatus: string) => void
}

export function WorkerOrderCard({ order, onUpdateProgress }: WorkerOrderCardProps) {
  const [isAssigning, setIsAssigning] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const { user, profile } = useAuth()

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pendiente':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock,
          text: 'Disponible para tomar'
        }
      case 'en_proceso':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Package,
          text: 'En Proceso'
        }
      case 'completado':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: UserCheck,
          text: 'Completado'
        }
      case 'entregado':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: UserCheck,
          text: 'Entregado'
        }
      case 'cancelado':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertCircle,
          text: 'Cancelado'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock,
          text: status
        }
    }
  }

  const handleTakeOrder = async () => {
    if (!user || !profile) return

    setIsAssigning(true)
    try {
      await OrdersService.assignOrderToWorker(order.id, user.id)
      toast.success('¡Pedido asignado exitosamente!')
      // La actualización se manejará por el tiempo real
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
        <div className='flex flex-col items-end space-y-2'>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}
          >
            <StatusIcon className='w-3 h-3 mr-1' />
            {statusConfig.text}
          </span>

          {isAssignedToMe && (
            <span className='inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800'>
              <User className='w-3 h-3 mr-1' />
              Asignado a ti
            </span>
          )}

          {isAssignedToOther && order.assignee && (
            <span className='inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800'>
              <User className='w-3 h-3 mr-1' />
              {order.assignee.full_name}
            </span>
          )}
        </div>
      </div>

      {/* Información del pedido */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
        <div className='space-y-2'>
          <div className='flex items-center text-sm text-gray-600'>
            <Calendar className='w-4 h-4 mr-2' />
            <span>Entrega: {new Date(order.fecha_entrega).toLocaleDateString()}</span>
          </div>

          <div className='flex items-center text-sm text-gray-600'>
            <DollarSign className='w-4 h-4 mr-2' />
            <span>
              ${order.monto_total.toFixed(2)} - {order.metodo_pago}
              {order.esta_pagado && (
                <span className='ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                  Pagado
                </span>
              )}
            </span>
          </div>

          {order.customer_phone && (
            <div className='flex items-center text-sm text-gray-600'>
              <Phone className='w-4 h-4 mr-2' />
              <span>{order.customer_phone}</span>
            </div>
          )}

          {order.customer_address && (
            <div className='flex items-center text-sm text-gray-600'>
              <MapPin className='w-4 h-4 mr-2' />
              <span>{order.customer_address}</span>
            </div>
          )}
        </div>

        <div>
          {order.creator && (
            <div className='flex items-center text-sm text-gray-600 mb-2'>
              <User className='w-4 h-4 mr-2' />
              <span>Creado por: {order.creator.full_name}</span>
            </div>
          )}
          <div className='text-xs text-gray-500'>Creado: {new Date(order.created_at).toLocaleString()}</div>
          {order.assigned_at && (
            <div className='text-xs text-gray-500'>Asignado: {new Date(order.assigned_at).toLocaleString()}</div>
          )}
        </div>
      </div>

      {/* Productos */}
      <div className='border-t pt-4 mb-4'>
        <h4 className='text-sm font-medium text-gray-900 mb-2'>Productos:</h4>
        <div className='space-y-1'>
          {order.lista_productos.map((product, index) => (
            <div key={index} className='flex justify-between text-sm'>
              <span>
                {product.producto} x{product.cantidad}
              </span>
              <span>${(product.precio * product.cantidad).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

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
          <button
            onClick={handleTakeOrder}
            disabled={isAssigning}
            className='w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {isAssigning ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                Tomando pedido...
              </>
            ) : (
              <>
                <Play className='w-4 h-4 mr-2' />
                Tomar este pedido
              </>
            )}
          </button>
        )}

        {isAssignedToMe && order.status !== 'entregado' && order.status !== 'cancelado' && (
          <div className='space-y-2'>
            <button
              onClick={() => onUpdateProgress?.(order.id, order.status)}
              className='w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
            >
              <MessageSquare className='w-4 h-4 mr-2' />
              Actualizar Progreso
            </button>

            {order.status === 'en_proceso' && (
              <button
                onClick={handleReleaseOrder}
                disabled={isReleasing}
                className='w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50'
              >
                {isReleasing ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2'></div>
                    Liberando...
                  </>
                ) : (
                  <>
                    <RefreshCw className='w-4 h-4 mr-2' />
                    Liberar Pedido
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {(isAssignedToOther || order.status === 'entregado' || order.status === 'cancelado') && (
          <div className='text-center text-sm text-gray-500 py-2'>
            {isAssignedToOther && 'Pedido asignado a otro trabajador'}
            {order.status === 'entregado' && 'Pedido entregado'}
            {order.status === 'cancelado' && 'Pedido cancelado'}
          </div>
        )}
      </div>
    </div>
  )
}

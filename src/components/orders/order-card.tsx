'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, DollarSign, Package, User, MapPin, Phone, Check, Clock, AlertCircle, UserCheck, ExternalLink } from 'lucide-react'
import { Order, Profile } from '@/types/database'
import { OrdersService } from '@/lib/services/order-services'
import { ProfileService } from '@/lib/services/profile-services'
import toast from 'react-hot-toast'

interface OrderCardProps {
  order: Order
  isAdmin?: boolean
  onRequestCancel?: (orderId: string) => void
}

export function OrderCard({ order, isAdmin = false, onRequestCancel }: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [workers, setWorkers] = useState<Profile[]>([])
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      ProfileService.getWorkers()
        .then(setWorkers)
        .catch(() => {})
    }
  }, [isAdmin])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pendiente':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pendiente' }
      case 'en_proceso':
        return { color: 'bg-blue-100 text-blue-800', icon: Package, text: 'En Proceso' }
      case 'completado':
        return { color: 'bg-green-100 text-green-800', icon: Check, text: 'Completado' }
      case 'pagado':
        return { color: 'bg-blue-100 text-blue-800', icon: Check, text: 'Pagado' }
      case 'entregado':
        return { color: 'bg-green-200 text-green-900', icon: Check, text: 'Entregado' }
      case 'cancelado':
        return { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Cancelado' }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Clock, text: status }
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!isAdmin) return
    if (newStatus === 'cancelado' && onRequestCancel) {
      onRequestCancel(order.id)
      return
    }
    setIsUpdating(true)
    try {
      await OrdersService.updateOrderStatus(order.id, newStatus)
      toast.success('Estado actualizado')
    } catch {
      toast.error('Error al actualizar estado')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAssign = async (workerId: string) => {
    if (!isAdmin) return
    setIsAssigning(true)
    try {
      if (workerId === '') {
        await OrdersService.adminAssignOrder(order.id, null)
        toast.success('Asignación removida')
      } else {
        await OrdersService.adminAssignOrder(order.id, workerId)
        const worker = workers.find((w) => w.id === workerId)
        toast.success(`Asignado a ${worker?.full_name ?? 'worker'}`)
      }
    } catch {
      toast.error('Error al asignar pedido')
    } finally {
      setIsAssigning(false)
    }
  }

  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className='bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow'>
      {/* Header */}
      <div className='flex items-start justify-between mb-4'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>{order.nombre_cliente}</h3>
          <p className='text-sm text-gray-500'>#{order.id.slice(-8)}</p>
        </div>
        <div className='flex items-center space-x-2'>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
            <StatusIcon className='w-3 h-3 mr-1' />
            {statusConfig.text}
          </span>
          {isAdmin && (
            <select
              value={order.status}
              onChange={(e) => updateStatus(e.target.value)}
              disabled={isUpdating}
              className='text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
            >
              <option value='pendiente'>Pendiente</option>
              <option value='en_proceso'>En Proceso</option>
              <option value='completado'>Completado</option>
              <option value='pagado'>Pagado</option>
              <option value='entregado'>Entregado</option>
              <option value='cancelado'>Cancelado</option>
            </select>
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

        <div className='space-y-2'>
          {order.creator && (
            <div className='flex items-center text-sm text-gray-600'>
              <User className='w-4 h-4 mr-2' />
              <span>Creado por: {order.creator.full_name}</span>
            </div>
          )}
          <div className='text-xs text-gray-500'>Creado: {new Date(order.created_at).toLocaleString()}</div>
        </div>
      </div>

      {/* Asignación (solo admin) */}
      {isAdmin && (
        <div className='border-t pt-4 mb-4'>
          <div className='flex items-center gap-3'>
            <UserCheck className='w-4 h-4 text-gray-400 flex-shrink-0' />
            <div className='flex-1'>
              {order.assignee ? (
                <p className='text-sm text-gray-600'>
                  Asignado a:{' '}
                  <span className='font-medium text-gray-900'>{order.assignee.full_name}</span>
                </p>
              ) : (
                <p className='text-sm text-gray-400 italic'>Sin asignar</p>
              )}
            </div>
            <select
              value={order.assigned_to ?? ''}
              onChange={(e) => handleAssign(e.target.value)}
              disabled={isAssigning}
              className='text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
            >
              <option value=''>Sin asignar</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Productos */}
      <div className='border-t pt-4'>
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
        <div className='border-t pt-4 mt-4'>
          <h4 className='text-sm font-medium text-gray-900 mb-1'>Notas:</h4>
          <p className='text-sm text-gray-600'>{order.notas}</p>
        </div>
      )}

      {/* Ver detalle (solo admin) */}
      {isAdmin && (
        <div className='border-t pt-4 mt-4 flex justify-end'>
          <Link
            href={`/admin/orders/${order.id}`}
            className='inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium'
          >
            Ver detalle
            <ExternalLink className='ml-1 h-3 w-3' />
          </Link>
        </div>
      )}
    </div>
  )
}

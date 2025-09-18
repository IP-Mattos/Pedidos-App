'use client'

import { useState } from 'react'
import { Calendar, DollarSign, Package, User, MapPin, Phone, Edit, Check, Clock, AlertCircle } from 'lucide-react'
import { Order } from '@/types/database'
import { OrdersService } from '@/lib/services/order-services'
import toast from 'react-hot-toast'

interface OrderCardProps {
  order: Order
  isAdmin?: boolean
}

export function OrderCard({ order, isAdmin = false }: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pendiente':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          text: 'Pendiente'
        }
      case 'en_proceso':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: Package,
          text: 'En Proceso'
        }
      case 'completado':
        return {
          color: 'bg-green-100 text-green-800',
          icon: Check,
          text: 'Completado'
        }
      case 'entregado':
        return {
          color: 'bg-green-100 text-green-800',
          icon: Check,
          text: 'Entregado'
        }
      case 'cancelado':
        return {
          color: 'bg-red-100 text-red-800',
          icon: AlertCircle,
          text: 'Cancelado'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: Clock,
          text: status
        }
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!isAdmin) return

    setIsUpdating(true)
    try {
      await OrdersService.updateOrderStatus(order.id, newStatus)
      toast.success('Estado actualizado')
    } catch (error) {
      toast.error('Error al actualizar estado')
    } finally {
      setIsUpdating(false)
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
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
          >
            <StatusIcon className='w-3 h-3 mr-1' />
            {statusConfig.text}
          </span>
          {isAdmin && (
            <select
              value={order.status}
              onChange={(e) => updateStatus(e.target.value)}
              disabled={isUpdating}
              className='text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='pendiente'>Pendiente</option>
              <option value='en_proceso'>En Proceso</option>
              <option value='completado'>Completado</option>
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

        <div>
          {order.creator && (
            <div className='flex items-center text-sm text-gray-600 mb-2'>
              <User className='w-4 h-4 mr-2' />
              <span>Creado por: {order.creator.full_name}</span>
            </div>
          )}
          <div className='text-xs text-gray-500'>Creado: {new Date(order.created_at).toLocaleString()}</div>
        </div>
      </div>

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
    </div>
  )
}

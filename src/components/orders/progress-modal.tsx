'use client'

import { useState, useEffect } from 'react'
import { X, Send, Loader2, Package, CheckCircle } from 'lucide-react'
import { OrdersService } from '@/lib/services/order-services'
import { ProductChecklist } from './product-checklist'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface ProgressModalProps {
  orderId: string
  currentStatus: string
  onClose: () => void
  onUpdate: () => void
}

export function ProgressModal({ orderId, currentStatus, onClose, onUpdate }: ProgressModalProps) {
  const [status, setStatus] = useState(currentStatus)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'checklist' | 'notes'>('checklist')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrder()
  }, [orderId])

  const loadOrder = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('orders').select('*').eq('id', orderId).single()

    if (data) {
      const productos =
        typeof data.lista_productos === 'string' ? JSON.parse(data.lista_productos) : data.lista_productos
      setOrder({ ...data, lista_productos: productos })
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!notes.trim() && activeTab === 'notes') {
      toast.error('Por favor agrega una nota sobre el progreso')
      return
    }

    setIsSubmitting(true)
    try {
      await OrdersService.addProgressUpdate(orderId, status, notes)
      toast.success('Progreso actualizado exitosamente')
      onUpdate()
      onClose()
    } catch (error) {
      toast.error('Error al actualizar el progreso')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
        <div className='bg-white rounded-lg max-w-2xl w-full p-6'>
          <div className='flex justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b'>
          <h3 className='text-lg font-semibold text-gray-900'>Actualizar Progreso del Pedido</h3>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Tabs */}
        <div className='flex border-b'>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'checklist'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className='flex items-center justify-center'>
              <Package className='h-4 w-4 mr-2' />
              Checklist de Productos
            </div>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'notes'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className='flex items-center justify-center'>
              <CheckCircle className='h-4 w-4 mr-2' />
              Actualización de Estado
            </div>
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6'>
          {activeTab === 'checklist' ? (
            <div>
              <div className='mb-4'>
                <h4 className='font-medium text-gray-900 mb-2'>Marca los productos que has conseguido:</h4>
                <p className='text-sm text-gray-600'>
                  Puedes marcar productos individuales o actualizar cantidades parciales.
                </p>
              </div>
              {order && <ProductChecklist orderId={orderId} products={order.lista_productos} isReadOnly={false} />}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Estado del Pedido</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='en_proceso'>En Proceso</option>
                  <option value='completado'>Completado</option>
                  <option value='entregado'>Entregado</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Notas del Progreso *</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder='Describe el estado actual del pedido, problemas encontrados, etc...'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  required
                />
              </div>

              <div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
                <p className='text-sm text-blue-800'>
                  💡 <strong>Tip:</strong> Usa la pestaña "Checklist de Productos" para marcar los productos
                  individuales que ya has conseguido.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className='border-t p-6'>
          <div className='flex space-x-3'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'
            >
              Cancelar
            </button>
            {activeTab === 'notes' && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !notes.trim()}
                className='flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className='w-4 h-4 mr-2' />
                    Actualizar Estado
                  </>
                )}
              </button>
            )}
            {activeTab === 'checklist' && (
              <button
                onClick={onClose}
                className='flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700'
              >
                <CheckCircle className='w-4 h-4 mr-2' />
                Guardar y Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

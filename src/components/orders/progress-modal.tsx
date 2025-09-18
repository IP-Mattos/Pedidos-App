'use client'

import { useState } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import { OrdersService } from '@/lib/services/order-services'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!notes.trim()) {
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

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg max-w-md w-full p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>Actualizar Progreso</h3>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
            <X className='w-5 h-5' />
          </button>
        </div>

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
              placeholder='Describe qué has hecho, el estado actual, problemas encontrados, etc...'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              required
            />
          </div>

          <div className='flex space-x-3'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'
            >
              Cancelar
            </button>
            <button
              type='submit'
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
                  Actualizar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

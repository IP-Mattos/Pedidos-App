'use client'

import { useState, useEffect } from 'react'
import { Check, Square, CheckSquare, Package, AlertCircle, Edit2, Save, X } from 'lucide-react'
import { ProductProgressService, type ProductProgress } from '@/lib/services/product-progress-services'
import toast from 'react-hot-toast'

interface ProductChecklistProps {
  orderId: string
  products: Array<{
    producto: string
    cantidad: number
    precio: number
  }>
  isReadOnly?: boolean
}

export function ProductChecklist({ orderId, products, isReadOnly = false }: ProductChecklistProps) {
  const [progress, setProgress] = useState<ProductProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editQuantity, setEditQuantity] = useState<number>(0)
  const [editNotes, setEditNotes] = useState<string>('')

  useEffect(() => {
    loadProgress()
  }, [orderId])

  const loadProgress = async () => {
    try {
      const data = await ProductProgressService.getOrderProductProgress(orderId)

      // Si no hay progreso, crear uno inicial basado en los productos
      if (data.length === 0 && products.length > 0) {
        await ProductProgressService.initializeProductProgress(orderId, products)
        const newData = await ProductProgressService.getOrderProductProgress(orderId)
        setProgress(newData)
      } else {
        setProgress(data)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleProduct = async (productIndex: number, currentStatus: boolean) => {
    if (isReadOnly) return

    try {
      await ProductProgressService.toggleProductComplete(orderId, productIndex, !currentStatus)
      toast.success(!currentStatus ? '✅ Producto marcado como conseguido' : '⚠️ Producto desmarcado')
      await loadProgress()
    } catch (error) {
      toast.error('Error al actualizar el producto')
    }
  }

  const handleUpdateQuantity = async (productIndex: number) => {
    if (isReadOnly) return

    try {
      const progressItem = progress.find((p) => p.product_index === productIndex)
      if (!progressItem) return

      const isCompleted = editQuantity >= progressItem.cantidad

      await ProductProgressService.updateProductProgress(orderId, productIndex, {
        cantidad_completada: editQuantity,
        is_completed: isCompleted,
        notes: editNotes
      })

      toast.success('Cantidad actualizada')
      setEditingIndex(null)
      await loadProgress()
    } catch (error) {
      toast.error('Error al actualizar la cantidad')
    }
  }

  const startEditing = (index: number) => {
    const progressItem = progress.find((p) => p.product_index === index)
    if (progressItem) {
      setEditQuantity(progressItem.cantidad_completada)
      setEditNotes(progressItem.notes || '')
      setEditingIndex(index)
    }
  }

  const calculateProgress = () => {
    if (progress.length === 0) return 0
    const completed = progress.filter((p) => p.is_completed).length
    return Math.round((completed / progress.length) * 100)
  }

  const overallProgress = calculateProgress()

  if (loading) {
    return (
      <div className='flex justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Barra de progreso general */}
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-2'>
          <span className='text-sm font-medium text-gray-700'>Progreso del Pedido</span>
          <span className='text-sm font-medium text-gray-900'>{overallProgress}%</span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2.5'>
          <div
            className='bg-blue-600 h-2.5 rounded-full transition-all duration-300'
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        {overallProgress === 100 && (
          <div className='mt-2 text-green-600 text-sm flex items-center'>
            <Check className='h-4 w-4 mr-1' />
            ¡Todos los productos conseguidos!
          </div>
        )}
      </div>

      {/* Lista de productos */}
      <div className='space-y-3'>
        {products.map((product, index) => {
          const progressItem = progress.find((p) => p.product_index === index)
          const isCompleted = progressItem?.is_completed || false
          const cantidadCompletada = progressItem?.cantidad_completada || 0
          const isEditing = editingIndex === index

          return (
            <div
              key={index}
              className={`border rounded-lg p-4 transition-all ${
                isCompleted ? 'bg-green-50 border-green-300' : 'bg-white border-gray-300'
              }`}
            >
              {isEditing ? (
                // Modo edición
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <p className='font-medium text-gray-900'>{product.producto}</p>
                      <p className='text-sm text-gray-500'>Total requerido: {product.cantidad}</p>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Cantidad conseguida</label>
                      <input
                        type='number'
                        min='0'
                        max={product.cantidad}
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Notas (opcional)</label>
                      <input
                        type='text'
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder='Ej: Falta por llegar'
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      />
                    </div>
                  </div>

                  <div className='flex space-x-2'>
                    <button
                      onClick={() => handleUpdateQuantity(index)}
                      className='flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm'
                    >
                      <Save className='h-3.5 w-3.5 mr-1' />
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingIndex(null)}
                      className='flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm'
                    >
                      <X className='h-3.5 w-3.5 mr-1' />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo visualización
                <div className='flex items-center justify-between'>
                  <div className='flex items-start space-x-3'>
                    {!isReadOnly && (
                      <button
                        onClick={() => handleToggleProduct(index, isCompleted)}
                        className='mt-0.5 hover:scale-110 transition-transform'
                      >
                        {isCompleted ? (
                          <CheckSquare className='h-5 w-5 text-green-600' />
                        ) : (
                          <Square className='h-5 w-5 text-gray-400' />
                        )}
                      </button>
                    )}

                    <div className='flex-1'>
                      <p className={`font-medium ${isCompleted ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                        {product.producto}
                      </p>
                      <div className='flex items-center space-x-4 mt-1'>
                        <span className='text-sm text-gray-500'>
                          Cantidad: {cantidadCompletada}/{product.cantidad}
                        </span>
                        {cantidadCompletada > 0 && cantidadCompletada < product.cantidad && (
                          <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                            Parcial
                          </span>
                        )}
                        {isCompleted && (
                          <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                            <Check className='h-3 w-3 mr-1' />
                            Completo
                          </span>
                        )}
                      </div>
                      {progressItem?.notes && (
                        <p className='text-sm text-gray-600 mt-1 italic'>Nota: {progressItem.notes}</p>
                      )}
                    </div>
                  </div>

                  {!isReadOnly && (
                    <button onClick={() => startEditing(index)} className='text-blue-600 hover:text-blue-700'>
                      <Edit2 className='h-4 w-4' />
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Resumen */}
      <div className='bg-gray-50 rounded-lg p-4 mt-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <Package className='h-5 w-5 text-gray-400 mr-2' />
            <span className='text-sm font-medium text-gray-700'>
              Productos conseguidos: {progress.filter((p) => p.is_completed).length} de {products.length}
            </span>
          </div>
          {!isReadOnly && overallProgress < 100 && (
            <span className='text-xs text-gray-500'>Haz clic en los checkbox para marcar productos</span>
          )}
        </div>
      </div>
    </div>
  )
}

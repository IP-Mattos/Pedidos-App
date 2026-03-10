'use client'

import { useState, useEffect } from 'react'
import { Check, CheckSquare, Square, Package, AlertTriangle, Edit2, Save, X } from 'lucide-react'
import { ProductProgressService, type ProductProgress } from '@/lib/services/product-progress-services'
import toast from 'react-hot-toast'

interface ProductChecklistProps {
  orderId: string
  products: Array<{ producto: string; cantidad: number; precio: number }>
  isReadOnly?: boolean
}

// Helpers para detectar el estado "falta"
const FALTA_PREFIX = 'FALTA:'
const isFalta = (notes?: string | null) => !!notes?.startsWith(FALTA_PREFIX)
const getFaltaReason = (notes?: string | null) => notes?.replace(FALTA_PREFIX, '').trim() ?? ''
const buildFaltaNotes = (reason: string) => `${FALTA_PREFIX} ${reason.trim()}`

type EditState = {
  cantidadCompletada: number
  falta: boolean
  faltaReason: string
  notes: string
}

export function ProductChecklist({ orderId, products, isReadOnly = false }: ProductChecklistProps) {
  const [progress, setProgress] = useState<ProductProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editState, setEditState] = useState<EditState>({ cantidadCompletada: 0, falta: false, faltaReason: '', notes: '' })

  useEffect(() => { loadProgress() }, [orderId])

  const loadProgress = async () => {
    try {
      const data = await ProductProgressService.getOrderProductProgress(orderId)
      if (data.length === 0 && products.length > 0) {
        await ProductProgressService.initializeProductProgress(orderId, products)
        setProgress(await ProductProgressService.getOrderProductProgress(orderId))
      } else {
        setProgress(data)
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (index: number, current: boolean) => {
    if (isReadOnly) return
    try {
      await ProductProgressService.toggleProductComplete(orderId, index, !current)
      toast.success(!current ? 'Producto marcado como conseguido' : 'Producto desmarcado')
      await loadProgress()
    } catch {
      toast.error('Error al actualizar el producto')
    }
  }

  const startEditing = (index: number) => {
    const item = progress.find((p) => p.product_index === index)
    if (!item) return
    const esFalta = isFalta(item.notes)
    setEditState({
      cantidadCompletada: item.cantidad_completada,
      falta: esFalta,
      faltaReason: esFalta ? getFaltaReason(item.notes) : '',
      notes: esFalta ? '' : (item.notes ?? '')
    })
    setEditingIndex(index)
  }

  const handleSave = async (index: number) => {
    const item = progress.find((p) => p.product_index === index)
    if (!item) return

    try {
      let notes: string
      let cantidad_completada: number
      let is_completed: boolean

      if (editState.falta) {
        if (!editState.faltaReason.trim()) {
          toast.error('Ingresá el motivo por el que falta el producto')
          return
        }
        notes = buildFaltaNotes(editState.faltaReason)
        cantidad_completada = 0
        is_completed = false
      } else {
        notes = editState.notes
        cantidad_completada = editState.cantidadCompletada
        is_completed = cantidad_completada >= item.cantidad
      }

      await ProductProgressService.updateProductProgress(orderId, index, { cantidad_completada, is_completed, notes })
      toast.success(editState.falta ? 'Producto marcado como faltante' : 'Producto actualizado')
      setEditingIndex(null)
      await loadProgress()
    } catch {
      toast.error('Error al guardar')
    }
  }

  const overallProgress =
    progress.length === 0 ? 0 : Math.round((progress.filter((p) => p.is_completed).length / progress.length) * 100)

  if (loading) {
    return <div className='flex justify-center py-8'><div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500' /></div>
  }

  return (
    <div className='space-y-4'>
      {/* Barra de progreso */}
      <div className='mb-4'>
        <div className='flex items-center justify-between mb-1'>
          <span className='text-sm font-medium text-gray-700'>Progreso del pedido</span>
          <span className='text-sm font-medium text-gray-900'>{overallProgress}%</span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2.5'>
          <div
            className='bg-blue-600 h-2.5 rounded-full transition-all duration-300'
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        {overallProgress === 100 && (
          <p className='mt-1 text-green-600 text-sm flex items-center gap-1'>
            <Check className='h-4 w-4' /> ¡Todos los productos conseguidos!
          </p>
        )}
      </div>

      {/* Lista */}
      <div className='space-y-2'>
        {products.map((product, index) => {
          const item = progress.find((p) => p.product_index === index)
          const isCompleted = item?.is_completed ?? false
          const esFalta = isFalta(item?.notes)
          const faltaReason = getFaltaReason(item?.notes)
          const cantidadCompletada = item?.cantidad_completada ?? 0
          const isEditing = editingIndex === index

          return (
            <div
              key={index}
              className={`border rounded-lg p-3 transition-all ${
                isCompleted
                  ? 'bg-green-50 border-green-300'
                  : esFalta
                  ? 'bg-red-50 border-red-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              {isEditing ? (
                <div className='space-y-3'>
                  <p className='font-medium text-gray-900'>{product.producto} <span className='text-xs text-gray-400'>(requerido: {product.cantidad})</span></p>

                  {/* Toggle falta */}
                  <label className='flex items-center gap-2 cursor-pointer w-fit'>
                    <input
                      type='checkbox'
                      checked={editState.falta}
                      onChange={(e) => setEditState((s) => ({ ...s, falta: e.target.checked, cantidadCompletada: e.target.checked ? 0 : s.cantidadCompletada }))}
                      className='h-4 w-4 text-red-600 rounded border-gray-300'
                    />
                    <span className='text-sm font-medium text-red-700'>No disponible / Falta</span>
                  </label>

                  {editState.falta ? (
                    <div>
                      <label className='block text-xs text-gray-600 mb-1'>Motivo *</label>
                      <input
                        type='text'
                        autoFocus
                        value={editState.faltaReason}
                        onChange={(e) => setEditState((s) => ({ ...s, faltaReason: e.target.value }))}
                        placeholder='Ej: No había en stock, se agotó...'
                        className='w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400 text-sm'
                      />
                    </div>
                  ) : (
                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <label className='block text-xs text-gray-600 mb-1'>Cantidad conseguida</label>
                        <input
                          type='number'
                          min='0'
                          max={product.cantidad}
                          value={editState.cantidadCompletada}
                          onChange={(e) => setEditState((s) => ({ ...s, cantidadCompletada: parseInt(e.target.value) || 0 }))}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                        />
                      </div>
                      <div>
                        <label className='block text-xs text-gray-600 mb-1'>Nota (opcional)</label>
                        <input
                          type='text'
                          value={editState.notes}
                          onChange={(e) => setEditState((s) => ({ ...s, notes: e.target.value }))}
                          placeholder='Obs...'
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
                        />
                      </div>
                    </div>
                  )}

                  <div className='flex gap-2'>
                    <button
                      onClick={() => handleSave(index)}
                      className='flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm'
                    >
                      <Save className='h-3.5 w-3.5 mr-1' /> Guardar
                    </button>
                    <button
                      onClick={() => setEditingIndex(null)}
                      className='flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm'
                    >
                      <X className='h-3.5 w-3.5 mr-1' /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex items-start gap-3 flex-1 min-w-0'>
                    {!isReadOnly && (
                      <button
                        onClick={() => !esFalta && handleToggle(index, isCompleted)}
                        disabled={esFalta}
                        className='mt-0.5 hover:scale-110 transition-transform disabled:cursor-not-allowed disabled:opacity-50 flex-shrink-0'
                      >
                        {isCompleted ? (
                          <CheckSquare className='h-5 w-5 text-green-600' />
                        ) : (
                          <Square className='h-5 w-5 text-gray-400' />
                        )}
                      </button>
                    )}

                    <div className='flex-1 min-w-0'>
                      <p className={`font-medium text-sm ${isCompleted ? 'text-green-800 line-through' : esFalta ? 'text-red-800' : 'text-gray-900'}`}>
                        {product.producto}
                      </p>
                      <div className='flex flex-wrap items-center gap-2 mt-0.5'>
                        <span className='text-xs text-gray-500'>{cantidadCompletada}/{product.cantidad}</span>

                        {isCompleted && (
                          <span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                            <Check className='h-3 w-3' /> Conseguido
                          </span>
                        )}
                        {esFalta && (
                          <span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                            <AlertTriangle className='h-3 w-3' /> Falta
                          </span>
                        )}
                        {cantidadCompletada > 0 && !isCompleted && !esFalta && (
                          <span className='inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                            Parcial
                          </span>
                        )}
                      </div>

                      {esFalta && faltaReason && (
                        <p className='text-xs text-red-600 mt-0.5 italic'>Motivo: {faltaReason}</p>
                      )}
                      {!esFalta && item?.notes && (
                        <p className='text-xs text-gray-500 mt-0.5 italic'>{item.notes}</p>
                      )}
                    </div>
                  </div>

                  {!isReadOnly && (
                    <button onClick={() => startEditing(index)} className='flex-shrink-0 text-blue-600 hover:text-blue-700 p-1'>
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
      <div className='bg-gray-50 rounded-lg p-3 mt-2'>
        <div className='flex items-center justify-between text-sm'>
          <div className='flex items-center gap-2'>
            <Package className='h-4 w-4 text-gray-400' />
            <span className='text-gray-700 font-medium'>
              {progress.filter((p) => p.is_completed).length}/{products.length} conseguidos
            </span>
          </div>
          {progress.some((p) => isFalta(p.notes)) && (
            <span className='text-xs text-red-600 font-medium flex items-center gap-1'>
              <AlertTriangle className='h-3 w-3' />
              {progress.filter((p) => isFalta(p.notes)).length} faltante(s)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

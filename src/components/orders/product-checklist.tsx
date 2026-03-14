'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Check, CheckSquare, Square, Package, AlertTriangle, Edit2, Save, X, ArrowLeftRight } from 'lucide-react'
import { ProductProgressService, type ProductProgress } from '@/lib/services/product-progress-services'
import toast from 'react-hot-toast'

interface ProductChecklistProps {
  orderId: string
  products: Array<{ producto: string; cantidad: number; precio: number }>
  isReadOnly?: boolean
}

const FALTA_PREFIX = 'FALTA:'
const CAMBIO_PREFIX = 'CAMBIO:'

const isFalta = (notes?: string | null) => !!notes?.startsWith(FALTA_PREFIX)
const isCambio = (notes?: string | null) => !!notes?.startsWith(CAMBIO_PREFIX)
const getFaltaReason = (notes?: string | null) => notes?.replace(FALTA_PREFIX, '').trim() ?? ''

const parseCambio = (notes?: string | null) => {
  const raw = notes?.replace(CAMBIO_PREFIX, '').trim() ?? ''
  const [producto, motivo] = raw.split('|').map((s) => s.trim())
  return { producto: producto ?? '', motivo: motivo ?? '' }
}
const buildCambioNotes = (producto: string, motivo: string) =>
  `${CAMBIO_PREFIX} ${producto.trim()} | ${motivo.trim()}`

type EditMode = 'normal' | 'falta' | 'cambio'

type EditState = {
  cantidadCompletada: number
  mode: EditMode
  faltaReason: string
  cambioProducto: string
  cambioMotivo: string
  notes: string
}

// Build optimistic progress from products (for initialization)
function buildInitialProgress(products: ProductChecklistProps['products']): ProductProgress[] {
  return products.map((p, i) => ({
    order_id: '',
    product_index: i,
    producto: p.producto,
    cantidad: p.cantidad,
    is_completed: false,
    cantidad_completada: 0,
  }))
}

export function ProductChecklist({ orderId, products, isReadOnly = false }: ProductChecklistProps) {
  const [progress, setProgress] = useState<ProductProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [savingIndex, setSavingIndex] = useState<number | null>(null)
  const [editState, setEditState] = useState<EditState>({
    cantidadCompletada: 0,
    mode: 'normal',
    faltaReason: '',
    cambioProducto: '',
    cambioMotivo: '',
    notes: ''
  })

  // Keep products in a ref so loadProgress doesn't recreate when parent re-renders
  const productsRef = useRef(products)
  productsRef.current = products

  const loadProgress = useCallback(async () => {
    const prods = productsRef.current
    try {
      const data = await ProductProgressService.getOrderProductProgress(orderId)
      if (data.length === 0 && prods.length > 0) {
        // Show optimistic state immediately, then initialize in background
        setProgress(buildInitialProgress(prods))
        setLoading(false)
        await ProductProgressService.initializeProductProgress(orderId, prods)
        const initialized = await ProductProgressService.getOrderProductProgress(orderId)
        setProgress(initialized)
      } else {
        setProgress(data)
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }, [orderId])  // only orderId — products read from ref to avoid stale-closure re-init

  useEffect(() => { loadProgress() }, [loadProgress])

  const handleToggle = async (index: number, current: boolean) => {
    if (isReadOnly) return
    const newCompleted = !current

    // Optimistic update — instant feedback
    setProgress(prev => prev.map(p =>
      p.product_index === index
        ? { ...p, is_completed: newCompleted, cantidad_completada: newCompleted ? p.cantidad : 0 }
        : p
    ))

    try {
      await ProductProgressService.toggleProductComplete(orderId, index, newCompleted)
      toast.success(newCompleted ? 'Producto conseguido ✓' : 'Producto desmarcado')
    } catch {
      // Revert on error
      setProgress(prev => prev.map(p =>
        p.product_index === index
          ? { ...p, is_completed: current, cantidad_completada: current ? p.cantidad : 0 }
          : p
      ))
      toast.error('Error al actualizar el producto')
    }
  }

  const startEditing = (index: number) => {
    const item = progress.find((p) => p.product_index === index)
    if (!item) return
    const esFalta = isFalta(item.notes)
    const esCambio = isCambio(item.notes)
    const cambio = esCambio ? parseCambio(item.notes) : { producto: '', motivo: '' }
    setEditState({
      cantidadCompletada: item.cantidad_completada,
      mode: esFalta ? 'falta' : esCambio ? 'cambio' : 'normal',
      faltaReason: esFalta ? getFaltaReason(item.notes) : '',
      cambioProducto: cambio.producto,
      cambioMotivo: cambio.motivo,
      notes: (!esFalta && !esCambio) ? (item.notes ?? '') : ''
    })
    setEditingIndex(index)
  }

  const handleSave = async (index: number) => {
    const item = progress.find((p) => p.product_index === index)
    if (!item) return

    let notes: string
    let cantidad_completada: number
    let is_completed: boolean

    if (editState.mode === 'falta') {
      if (!editState.faltaReason.trim()) {
        toast.error('Ingresá el motivo por el que falta el producto')
        return
      }
      notes = `${FALTA_PREFIX} ${editState.faltaReason.trim()}`
      cantidad_completada = 0
      is_completed = false
    } else if (editState.mode === 'cambio') {
      if (!editState.cambioProducto.trim()) {
        toast.error('Ingresá el producto de reemplazo')
        return
      }
      notes = buildCambioNotes(editState.cambioProducto, editState.cambioMotivo)
      cantidad_completada = item.cantidad
      is_completed = true
    } else {
      notes = editState.notes
      cantidad_completada = editState.cantidadCompletada
      is_completed = cantidad_completada >= item.cantidad
    }

    const prevProgress = progress

    // Optimistic update — close modal immediately
    setProgress(prev => prev.map(p =>
      p.product_index === index
        ? { ...p, is_completed, cantidad_completada, notes }
        : p
    ))
    setEditingIndex(null)
    setSavingIndex(index)

    try {
      await ProductProgressService.updateProductProgress(orderId, index, { cantidad_completada, is_completed, notes })
      toast.success(
        editState.mode === 'falta' ? 'Marcado como faltante' :
        editState.mode === 'cambio' ? 'Sustitución guardada' :
        'Producto actualizado'
      )
    } catch {
      setProgress(prevProgress)
      setEditingIndex(index)
      toast.error('Error al guardar')
    } finally {
      setSavingIndex(null)
    }
  }

  const overallProgress = useMemo(
    () => progress.length === 0 ? 0 : Math.round((progress.filter((p) => p.is_completed).length / progress.length) * 100),
    [progress]
  )

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
          const esCambio = isCambio(item?.notes)
          const faltaReason = getFaltaReason(item?.notes)
          const cambio = esCambio ? parseCambio(item?.notes) : null
          const cantidadCompletada = item?.cantidad_completada ?? 0
          const isEditing = editingIndex === index
          const isSaving = savingIndex === index

          return (
            <div
              key={index}
              className={`border rounded-lg p-3 transition-all duration-150 ${
                isCompleted && !esCambio
                  ? 'bg-green-50 border-green-300'
                  : esFalta
                  ? 'bg-red-50 border-red-300'
                  : esCambio
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-white border-gray-200'
              } ${isSaving ? 'opacity-70' : ''}`}
            >
              {isEditing ? (
                <div className='space-y-3'>
                  <p className='font-medium text-gray-900'>
                    {product.producto} <span className='text-xs text-gray-400'>(requerido: {product.cantidad})</span>
                  </p>

                  {/* Selector de modo */}
                  <div className='flex gap-2 flex-wrap'>
                    {(['normal', 'cambio', 'falta'] as EditMode[]).map((m) => (
                      <button
                        key={m}
                        type='button'
                        onClick={() => setEditState((s) => ({ ...s, mode: m }))}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          editState.mode === m
                            ? m === 'falta' ? 'bg-red-100 border-red-400 text-red-700'
                              : m === 'cambio' ? 'bg-amber-100 border-amber-400 text-amber-700'
                              : 'bg-blue-100 border-blue-400 text-blue-700'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {m === 'normal' ? 'Normal' : m === 'cambio' ? 'Cambiar por otro' : 'No disponible'}
                      </button>
                    ))}
                  </div>

                  {editState.mode === 'falta' && (
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
                  )}

                  {editState.mode === 'cambio' && (
                    <div className='space-y-2'>
                      <div>
                        <label className='block text-xs text-gray-600 mb-1'>Producto de reemplazo *</label>
                        <input
                          type='text'
                          autoFocus
                          value={editState.cambioProducto}
                          onChange={(e) => setEditState((s) => ({ ...s, cambioProducto: e.target.value }))}
                          placeholder='Ej: Leche entera 1L'
                          className='w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm'
                        />
                      </div>
                      <div>
                        <label className='block text-xs text-gray-600 mb-1'>Motivo (opcional)</label>
                        <input
                          type='text'
                          value={editState.cambioMotivo}
                          onChange={(e) => setEditState((s) => ({ ...s, cambioMotivo: e.target.value }))}
                          placeholder='Ej: No había el original'
                          className='w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm'
                        />
                      </div>
                    </div>
                  )}

                  {editState.mode === 'normal' && (
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
                        onClick={() => !esFalta && !esCambio && handleToggle(index, isCompleted)}
                        disabled={esFalta || esCambio || isSaving}
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
                      <p className={`font-medium text-sm ${
                        esFalta ? 'text-red-800' :
                        esCambio ? 'text-amber-800' :
                        isCompleted ? 'text-green-800 line-through' :
                        'text-gray-900'
                      }`}>
                        {product.producto}
                      </p>
                      <div className='flex flex-wrap items-center gap-2 mt-0.5'>
                        {!esCambio && (
                          <span className='text-xs text-gray-500'>{cantidadCompletada}/{product.cantidad}</span>
                        )}
                        {isCompleted && !esCambio && (
                          <span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                            <Check className='h-3 w-3' /> Conseguido
                          </span>
                        )}
                        {esFalta && (
                          <span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                            <AlertTriangle className='h-3 w-3' /> Falta
                          </span>
                        )}
                        {esCambio && (
                          <span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700'>
                            <ArrowLeftRight className='h-3 w-3' /> Cambiado
                          </span>
                        )}
                        {cantidadCompletada > 0 && !isCompleted && !esFalta && !esCambio && (
                          <span className='inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                            Parcial
                          </span>
                        )}
                      </div>

                      {esFalta && faltaReason && (
                        <p className='text-xs text-red-600 mt-0.5 italic'>Motivo: {faltaReason}</p>
                      )}
                      {esCambio && cambio && (
                        <p className='text-xs text-amber-700 mt-0.5'>
                          → <span className='font-medium'>{cambio.producto}</span>
                          {cambio.motivo && <span className='text-amber-600 italic'> ({cambio.motivo})</span>}
                        </p>
                      )}
                      {!esFalta && !esCambio && item?.notes && (
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
        <div className='flex items-center justify-between text-sm flex-wrap gap-2'>
          <div className='flex items-center gap-2'>
            <Package className='h-4 w-4 text-gray-400' />
            <span className='text-gray-700 font-medium'>
              {progress.filter((p) => p.is_completed).length}/{products.length} completados
            </span>
          </div>
          <div className='flex items-center gap-3'>
            {progress.some((p) => isFalta(p.notes)) && (
              <span className='text-xs text-red-600 font-medium flex items-center gap-1'>
                <AlertTriangle className='h-3 w-3' />
                {progress.filter((p) => isFalta(p.notes)).length} faltante(s)
              </span>
            )}
            {progress.some((p) => isCambio(p.notes)) && (
              <span className='text-xs text-amber-600 font-medium flex items-center gap-1'>
                <ArrowLeftRight className='h-3 w-3' />
                {progress.filter((p) => isCambio(p.notes)).length} cambiado(s)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

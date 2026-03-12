'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2, X } from 'lucide-react'
import type { ProductFormData } from '@/lib/validations/orders'

interface ProductListProps {
  products: ProductFormData[]
  onChange: (products: ProductFormData[]) => void
}

export function ProductList({ products, onChange }: ProductListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [current, setCurrent] = useState<ProductFormData>({ producto: '', cantidad: 1, precio: 0 })

  const commit = () => {
    if (!current.producto.trim()) return
    if (editingIndex !== null) {
      const updated = [...products]
      updated[editingIndex] = current
      onChange(updated)
      setEditingIndex(null)
    } else {
      onChange([...products, current])
    }
    setCurrent({ producto: '', cantidad: 1, precio: 0 })
  }

  const remove = (i: number) => onChange(products.filter((_, idx) => idx !== i))

  const edit = (i: number) => { setCurrent(products[i]); setEditingIndex(i) }

  const cancel = () => { setEditingIndex(null); setCurrent({ producto: '', cantidad: 1, precio: 0 }) }

  const total = products.reduce((s, p) => s + p.precio * p.cantidad, 0)

  return (
    <div className='space-y-4'>
      {/* Lista */}
      {products.length > 0 && (
        <div className='bg-gray-50 rounded-lg p-3 sm:p-4'>
          <h3 className='font-medium text-gray-900 mb-3 text-sm'>Productos agregados</h3>
          <div className='space-y-2'>
            {products.map((p, i) => (
              <div key={i} className='flex items-center justify-between bg-white p-2.5 sm:p-3 rounded border gap-2'>
                <div className='flex-1 min-w-0'>
                  <span className='font-medium text-sm block truncate'>{p.producto}</span>
                  <span className='text-gray-500 text-xs'>
                    {p.cantidad} × {p.precio > 0 ? `$${p.precio.toFixed(2)}` : 'sin precio'}
                    {p.precio > 0 && ` = $${(p.cantidad * p.precio).toFixed(2)}`}
                  </span>
                </div>
                <div className='flex gap-2 flex-shrink-0'>
                  <button type='button' onClick={() => edit(i)} className='text-blue-600 hover:text-blue-800 p-1'>
                    <Edit2 className='h-4 w-4' />
                  </button>
                  <button type='button' onClick={() => remove(i)} className='text-red-600 hover:text-red-800 p-1'>
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {total > 0 && (
            <div className='mt-3 pt-3 border-t text-right'>
              <span className='text-base font-bold'>Total: ${total.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Form */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4'>
        <h3 className='font-medium text-blue-900 mb-3 text-sm'>
          {editingIndex !== null ? 'Editar producto' : 'Agregar producto'}
        </h3>
        <div className='grid grid-cols-1 sm:grid-cols-12 gap-3'>
          <div className='sm:col-span-5'>
            <label className='block text-xs font-medium text-gray-700 mb-1'>Producto *</label>
            <input
              type='text'
              value={current.producto}
              onChange={(e) => setCurrent({ ...current, producto: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), commit())}
              placeholder='Nombre del producto'
              className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <div className='sm:col-span-3'>
            <label className='block text-xs font-medium text-gray-700 mb-1'>Cantidad</label>
            <input
              type='number'
              min='1'
              value={current.cantidad}
              onChange={(e) => setCurrent({ ...current, cantidad: parseInt(e.target.value) || 1 })}
              className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <div className='sm:col-span-4'>
            <label className='block text-xs font-medium text-gray-700 mb-1'>Precio <span className='text-gray-400 font-normal'>(opcional)</span></label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>$</span>
              <input
                type='number'
                min='0'
                step='0.01'
                value={current.precio || ''}
                placeholder='0'
                onChange={(e) => setCurrent({ ...current, precio: parseFloat(e.target.value) || 0 })}
                className='w-full pl-6 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>
        </div>

        <div className='flex gap-2 mt-3'>
          <button
            type='button'
            onClick={commit}
            disabled={!current.producto.trim()}
            className='flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm'
          >
            <Plus className='h-4 w-4' />
            {editingIndex !== null ? 'Actualizar' : 'Agregar'}
          </button>
          {editingIndex !== null && (
            <button type='button' onClick={cancel} className='flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm'>
              <X className='h-4 w-4' /> Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

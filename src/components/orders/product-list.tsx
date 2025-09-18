'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import type { ProductFormData } from '@/lib/validations/orders'

interface ProductListProps {
  products: ProductFormData[]
  onChange: (products: ProductFormData[]) => void
}

export function ProductList({ products, onChange }: ProductListProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [currentProduct, setCurrentProduct] = useState<ProductFormData>({
    producto: '',
    cantidad: 1,
    precio: 0
  })

  const addProduct = () => {
    if (!currentProduct.producto || currentProduct.precio <= 0) return

    if (editingIndex !== null) {
      // Editar producto existente
      const updatedProducts = [...products]
      updatedProducts[editingIndex] = currentProduct
      onChange(updatedProducts)
      setEditingIndex(null)
    } else {
      // Agregar nuevo producto
      onChange([...products, currentProduct])
    }

    setCurrentProduct({ producto: '', cantidad: 1, precio: 0 })
  }

  const removeProduct = (index: number) => {
    onChange(products.filter((_, i) => i !== index))
  }

  const editProduct = (index: number) => {
    setCurrentProduct(products[index])
    setEditingIndex(index)
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setCurrentProduct({ producto: '', cantidad: 1, precio: 0 })
  }

  const total = products.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

  return (
    <div className='space-y-4'>
      {/* Lista de productos */}
      {products.length > 0 && (
        <div className='bg-gray-50 rounded-lg p-4'>
          <h3 className='font-medium text-gray-900 mb-3'>Productos agregados:</h3>
          <div className='space-y-2'>
            {products.map((product, index) => (
              <div key={index} className='flex items-center justify-between bg-white p-3 rounded border'>
                <div className='flex-1'>
                  <span className='font-medium'>{product.producto}</span>
                  <span className='text-gray-500 ml-2'>
                    {product.cantidad} x ${product.precio.toFixed(2)} = $
                    {(product.cantidad * product.precio).toFixed(2)}
                  </span>
                </div>
                <div className='flex space-x-2'>
                  <button
                    type='button'
                    onClick={() => editProduct(index)}
                    className='text-blue-600 hover:text-blue-800'
                  >
                    <Edit2 className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    onClick={() => removeProduct(index)}
                    className='text-red-600 hover:text-red-800'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className='mt-3 pt-3 border-t'>
            <div className='text-right'>
              <span className='text-lg font-bold'>Total: ${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Formulario para agregar/editar producto */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
        <h3 className='font-medium text-blue-900 mb-3'>
          {editingIndex !== null ? 'Editar Producto' : 'Agregar Producto'}
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='md:col-span-2'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Producto</label>
            <input
              type='text'
              value={currentProduct.producto}
              onChange={(e) => setCurrentProduct({ ...currentProduct, producto: e.target.value })}
              placeholder='Nombre del producto'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Cantidad</label>
            <input
              type='number'
              min='1'
              value={currentProduct.cantidad}
              onChange={(e) => setCurrentProduct({ ...currentProduct, cantidad: parseInt(e.target.value) || 1 })}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Precio ($)</label>
            <input
              type='number'
              min='0'
              step='0.01'
              value={currentProduct.precio}
              onChange={(e) => setCurrentProduct({ ...currentProduct, precio: parseFloat(e.target.value) || 0 })}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>

        <div className='flex space-x-2 mt-4'>
          <button
            type='button'
            onClick={addProduct}
            disabled={!currentProduct.producto || currentProduct.precio <= 0}
            className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <Plus className='h-4 w-4 mr-2' />
            {editingIndex !== null ? 'Actualizar' : 'Agregar'}
          </button>

          {editingIndex !== null && (
            <button
              type='button'
              onClick={cancelEdit}
              className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

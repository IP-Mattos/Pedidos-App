'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { MainLayout } from '@/components/layout/main-layout'
import { ProductList } from '@/components/orders/product-list'
import { OrdersService } from '@/lib/services/order-services'
import { createOrderSchema, type CreateOrderFormData, type ProductFormData } from '@/lib/validations/orders'
import { useAuth } from '@/hooks/use-auth'

export default function CreateOrderPage() {
  const [products, setProducts] = useState<ProductFormData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { profile } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      esta_pagado: false,
      metodo_pago: 'efectivo',
      fecha_entrega: new Date().toISOString().split('T')[0] // Fecha de hoy
    }
  })

  const onSubmit = async (data: CreateOrderFormData) => {
    if (products.length === 0) {
      toast.error('Debe agregar al menos un producto')
      return
    }

    setIsSubmitting(true)

    try {
      const orderData = {
        ...data,
        productos: products
      }

      const order = await OrdersService.createOrder(orderData)

      toast.success('¡Pedido creado exitosamente!')
      router.push('/admin/orders')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear el pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProductsChange = (newProducts: ProductFormData[]) => {
    setProducts(newProducts)
    setValue('productos', newProducts)
  }

  if (profile?.role !== 'admin') {
    return (
      <MainLayout>
        <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-gray-900'>Acceso Denegado</h1>
            <p className='text-gray-600'>No tienes permisos para crear pedidos.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className='max-w-4xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Crear Nuevo Pedido</h1>
              <p className='mt-2 text-gray-600'>Completa la información del pedido y agrega los productos.</p>
            </div>
            <Link href='/admin/orders'>
              <button className='flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Volver
              </button>
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
          {/* Información del cliente */}
          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>Información del Cliente</h2>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Nombre del Cliente *</label>
                <input
                  type='text'
                  {...register('nombre_cliente')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Nombre completo del cliente'
                />
                {errors.nombre_cliente && <p className='mt-1 text-sm text-red-600'>{errors.nombre_cliente.message}</p>}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Teléfono</label>
                <input
                  type='tel'
                  {...register('customer_phone')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Número de teléfono'
                />
              </div>

              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Dirección</label>
                <input
                  type='text'
                  {...register('customer_address')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='Dirección de entrega'
                />
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>Productos</h2>
            <ProductList products={products} onChange={handleProductsChange} />
            {errors.productos && <p className='mt-2 text-sm text-red-600'>{errors.productos.message}</p>}
          </div>

          {/* Detalles del pedido */}
          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>Detalles del Pedido</h2>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Fecha de Entrega *</label>
                <input
                  type='date'
                  {...register('fecha_entrega')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                {errors.fecha_entrega && <p className='mt-1 text-sm text-red-600'>{errors.fecha_entrega.message}</p>}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Método de Pago *</label>
                <select
                  {...register('metodo_pago')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='efectivo'>Efectivo</option>
                  <option value='credito'>Tarjeta de Crédito</option>
                  <option value='dolares'>Dólares</option>
                  <option value='cheque'>Cheque</option>
                  <option value='transferencia'>Transferencia</option>
                </select>
              </div>

              <div className='flex items-center'>
                <input
                  type='checkbox'
                  {...register('esta_pagado')}
                  className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                />
                <label className='ml-2 block text-sm text-gray-700'>¿Ya está pagado?</label>
              </div>
            </div>

            <div className='mt-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Notas Adicionales</label>
              <textarea
                {...register('notas')}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Cualquier información adicional sobre el pedido...'
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className='flex justify-end space-x-4'>
            <Link href='/admin/orders'>
              <button
                type='button'
                className='px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
              >
                Cancelar
              </button>
            </Link>

            <button
              type='submit'
              disabled={isSubmitting || products.length === 0}
              className='flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creando...
                </>
              ) : (
                <>
                  <Save className='mr-2 h-4 w-4' />
                  Crear Pedido
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

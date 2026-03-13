'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

import { MainLayout } from '@/components/layout/main-layout'
import { SmartProductInput } from '@/components/orders/smart-product-input'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { OrdersService } from '@/lib/services/order-services'
import { createOrderSchema, type CreateOrderFormData, type ProductFormData } from '@/lib/validations/orders'
import { useAuth } from '@/hooks/use-auth'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'

export default function EditOrderPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { profile } = useAuth()

  const [products, setProducts] = useState<ProductFormData[]>([])
  const [loadingOrder, setLoadingOrder] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch
  } = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      esta_pagado: false,
      metodo_pago: 'efectivo',
      requiere_boleta: false,
      es_ingreso: false
    }
  })

  const requiereBoleta = watch('requiere_boleta') ?? false
  const esIngreso = watch('es_ingreso') ?? false

  useEffect(() => {
    OrdersService.getOrderById(id)
      .then((order) => {
        reset({
          nombre_cliente: order.nombre_cliente,
          customer_phone: order.customer_phone ?? '',
          customer_address: order.customer_address ?? '',
          fecha_entrega: order.fecha_entrega.split('T')[0],
          metodo_pago: order.metodo_pago as CreateOrderFormData['metodo_pago'],
          esta_pagado: order.esta_pagado,
          notas: order.notas ?? '',
          productos: order.lista_productos as ProductFormData[],
          requiere_boleta: order.requiere_boleta ?? false,
          rut_cliente: order.rut_cliente ?? '',
          es_ingreso: order.es_ingreso ?? false
        })
        setProducts(order.lista_productos as ProductFormData[])
      })
      .catch(() => toast.error('Error al cargar el pedido'))
      .finally(() => setLoadingOrder(false))
  }, [id, reset])

  const onSubmit = async (data: CreateOrderFormData) => {
    if (products.length === 0) {
      toast.error('Debe agregar al menos un producto')
      return
    }
    setIsSubmitting(true)
    try {
      const total = products.reduce((sum, p) => sum + p.precio * p.cantidad, 0)
      await OrdersService.updateOrder(id, {
        nombre_cliente: data.nombre_cliente,
        customer_phone: data.customer_phone || null,
        customer_address: data.customer_address || null,
        fecha_entrega: data.fecha_entrega,
        metodo_pago: data.metodo_pago,
        esta_pagado: data.es_ingreso ? false : data.esta_pagado,
        lista_productos: products,
        monto_total: total,
        notas: data.notas || null,
        requiere_boleta: data.requiere_boleta,
        rut_cliente: data.requiere_boleta && data.rut_cliente ? data.rut_cliente : null,
        es_ingreso: data.es_ingreso
      })
      toast.success('Pedido actualizado')
      router.push(`/admin/orders/${id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <MainLayout>
        <div className='max-w-4xl mx-auto py-6 px-4 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Acceso Denegado</h1>
        </div>
      </MainLayout>
    )
  }

  if (loadingOrder) {
    return (
      <MainLayout>
        <LoadingSpinner message='Cargando pedido...' />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className='max-w-4xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Editar Pedido</h1>
            <p className='mt-1 text-sm text-gray-500'>ID: {id}</p>
          </div>
          <button
            type='button'
            onClick={() => router.push(`/admin/orders/${id}`)}
            className='flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Volver
          </button>
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
                />
                {errors.nombre_cliente && <p className='mt-1 text-sm text-red-600'>{errors.nombre_cliente.message}</p>}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Teléfono</label>
                <input
                  type='tel'
                  {...register('customer_phone')}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Dirección de entrega</label>
                <AddressAutocomplete
                  value={watch('customer_address') ?? ''}
                  onChange={(val) => setValue('customer_address', val)}
                />
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>Productos</h2>
            <SmartProductInput
              products={products}
              onChange={(newProducts) => {
                setProducts(newProducts)
                setValue('productos', newProducts)
              }}
            />
            {errors.productos && <p className='mt-2 text-sm text-red-600'>{errors.productos.message}</p>}
          </div>

          {/* Detalles del pedido */}
          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-medium text-gray-900'>Detalles del Pedido</h2>
              {/* Es ingreso toggle */}
              <label className='flex items-center gap-2 cursor-pointer select-none'>
                <span className='text-sm font-medium text-gray-700'>Es ingreso</span>
                <div
                  onClick={() => setValue('es_ingreso', !esIngreso)}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${esIngreso ? 'bg-orange-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${esIngreso ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </label>
            </div>

            {esIngreso && (
              <div className='mb-4 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5 text-sm text-orange-800'>
                Modo ingreso activo — los campos de pago no aplican.
              </div>
            )}

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

              {!esIngreso && (
                <>
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

                  <div className='flex items-center pt-6'>
                    <input
                      type='checkbox'
                      {...register('esta_pagado')}
                      className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                    />
                    <label className='ml-2 block text-sm text-gray-700'>¿Ya está pagado?</label>
                  </div>
                </>
              )}
            </div>

            <div className='mt-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Notas Adicionales</label>
              <textarea
                {...register('notas')}
                rows={3}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>

          {/* Boleta con RUT */}
          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>Boleta</h2>
            <div className='flex items-center gap-3 mb-4'>
              <input
                type='checkbox'
                id='requiere_boleta_edit'
                {...register('requiere_boleta')}
                className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
              />
              <label htmlFor='requiere_boleta_edit' className='text-sm text-gray-700'>
                ¿Requiere boleta con RUT?
              </label>
            </div>
            {requiereBoleta && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>RUT del cliente</label>
                <input
                  type='text'
                  {...register('rut_cliente')}
                  placeholder='Ej: 21.234.567-8'
                  className='w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            )}
          </div>

          <div className='flex justify-end gap-4'>
            <button
              type='button'
              onClick={() => router.push(`/admin/orders/${id}`)}
              className='px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={isSubmitting || products.length === 0}
              className='flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className='mr-2 h-4 w-4' />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

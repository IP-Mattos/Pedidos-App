'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { useAuth } from '@/hooks/use-auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CustomerService } from '@/lib/services/customer-services'
import type { Customer } from '@/types/database'
import { Users, Phone, MapPin, Search, Pencil, Check, X, Package, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

type CustomerWithStats = Customer & { order_count: number; last_order_at: string | null }

function EditRow({ customer, onSave, onCancel }: {
  customer: CustomerWithStats
  onSave: (id: string, nombre: string, phone: string, address: string, rut: string) => Promise<void>
  onCancel: () => void
}) {
  const [nombre, setNombre] = useState(customer.nombre)
  const [phone, setPhone] = useState(customer.phone ?? '')
  const [address, setAddress] = useState(customer.address ?? '')
  const [rut, setRut] = useState(customer.rut ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!nombre.trim()) return
    setSaving(true)
    await onSave(customer.id, nombre, phone, address, rut)
    setSaving(false)
  }

  return (
    <tr className='bg-blue-50'>
      <td className='px-4 py-3'>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className='w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
      </td>
      <td className='px-4 py-3'>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder='Teléfono'
          className='w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
      </td>
      <td className='px-4 py-3'>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder='Dirección'
          className='w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
      </td>
      <td className='px-4 py-3'>
        <input
          value={rut}
          onChange={(e) => setRut(e.target.value)}
          placeholder='Ej: 21.234.567-8'
          className='w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
      </td>
      <td className='px-4 py-3 text-sm text-gray-500'>{customer.order_count}</td>
      <td className='px-4 py-3'>
        <div className='flex items-center gap-2'>
          <button
            onClick={handleSave}
            disabled={saving || !nombre.trim()}
            className='inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
          >
            <Check className='h-3 w-3' />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={onCancel}
            className='inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50'
          >
            <X className='h-3 w-3' />
            Cancelar
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function CustomersPage() {
  const { profile } = useAuth()
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await CustomerService.getAllWithStats()
      setCustomers(data)
    } catch {
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (profile?.role !== 'admin') {
    return (
      <MainLayout>
        <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Acceso Denegado</h1>
        </div>
      </MainLayout>
    )
  }

  if (loading) {
    return <MainLayout><LoadingSpinner message='Cargando clientes...' /></MainLayout>
  }

  const filtered = customers.filter((c) =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone ?? '').includes(searchTerm) ||
    (c.address ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.rut ?? '').includes(searchTerm)
  )

  const handleSave = async (id: string, nombre: string, phone: string, address: string, rut: string) => {
    try {
      await CustomerService.update(id, {
        nombre: nombre.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        rut: rut.trim() || null
      })
      toast.success('Cliente actualizado')
      setEditingId(null)
      await load()
    } catch {
      toast.error('Error al actualizar cliente')
    }
  }

  return (
    <MainLayout>
      <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Clientes</h1>
          <p className='mt-2 text-gray-600'>Clientes registrados automáticamente al crear pedidos</p>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <Users className='h-6 w-6 text-blue-400' />
                <div className='ml-5'>
                  <dt className='text-sm font-medium text-gray-500'>Total clientes</dt>
                  <dd className='text-lg font-medium text-gray-900'>{customers.length}</dd>
                </div>
              </div>
            </div>
          </div>
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <Phone className='h-6 w-6 text-green-400' />
                <div className='ml-5'>
                  <dt className='text-sm font-medium text-gray-500'>Con teléfono</dt>
                  <dd className='text-lg font-medium text-gray-900'>{customers.filter((c) => c.phone).length}</dd>
                </div>
              </div>
            </div>
          </div>
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <MapPin className='h-6 w-6 text-purple-400' />
                <div className='ml-5'>
                  <dt className='text-sm font-medium text-gray-500'>Con dirección</dt>
                  <dd className='text-lg font-medium text-gray-900'>{customers.filter((c) => c.address).length}</dd>
                </div>
              </div>
            </div>
          </div>
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <FileText className='h-6 w-6 text-orange-400' />
                <div className='ml-5'>
                  <dt className='text-sm font-medium text-gray-500'>Con RUT</dt>
                  <dd className='text-lg font-medium text-gray-900'>{customers.filter((c) => c.rut).length}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className='bg-white shadow rounded-lg p-4 mb-6'>
          <div className='relative max-w-sm'>
            <Search className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
            <input
              type='text'
              placeholder='Buscar por nombre, teléfono, dirección o RUT...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            />
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className='text-center py-12 bg-white rounded-lg shadow'>
            <Users className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>No hay clientes</h3>
            <p className='mt-1 text-sm text-gray-500'>
              {customers.length === 0
                ? 'Los clientes se crean automáticamente al generar pedidos.'
                : 'No coincide con la búsqueda.'}
            </p>
          </div>
        ) : (
          <div className='bg-white shadow rounded-lg overflow-hidden'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Nombre</th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Teléfono</th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Dirección</th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>RUT</th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <span className='flex items-center gap-1'><Package className='h-3.5 w-3.5' />Pedidos</span>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Acciones</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {filtered.map((customer) =>
                  editingId === customer.id ? (
                    <EditRow
                      key={customer.id}
                      customer={customer}
                      onSave={handleSave}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <tr key={customer.id} className='hover:bg-gray-50'>
                      <td className='px-4 py-3'>
                        <p className='text-sm font-medium text-gray-900'>{customer.nombre}</p>
                        {customer.last_order_at && (
                          <p className='text-xs text-gray-400 mt-0.5'>
                            Último pedido: {new Date(customer.last_order_at).toLocaleDateString('es-UY')}
                          </p>
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        {customer.phone ? (
                          <span className='flex items-center gap-1.5 text-sm text-gray-700'>
                            <Phone className='h-3.5 w-3.5 text-gray-400' />
                            {customer.phone}
                          </span>
                        ) : (
                          <span className='text-xs text-gray-400 italic'>—</span>
                        )}
                      </td>
                      <td className='px-4 py-3 max-w-xs'>
                        {customer.address ? (
                          <span className='flex items-start gap-1.5 text-sm text-gray-700'>
                            <MapPin className='h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0' />
                            <span className='line-clamp-2'>{customer.address}</span>
                          </span>
                        ) : (
                          <span className='text-xs text-gray-400 italic'>—</span>
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        {customer.rut ? (
                          <span className='flex items-center gap-1.5 text-sm text-gray-700'>
                            <FileText className='h-3.5 w-3.5 text-gray-400' />
                            {customer.rut}
                          </span>
                        ) : (
                          <span className='text-xs text-gray-400 italic'>—</span>
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700'>
                          {customer.order_count}
                        </span>
                      </td>
                      <td className='px-4 py-3'>
                        <button
                          onClick={() => setEditingId(customer.id)}
                          className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors'
                        >
                          <Pencil className='h-3 w-3' />
                          Editar
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
            <div className='px-4 py-3 border-t bg-gray-50 text-xs text-gray-500'>
              {filtered.length} cliente(s)
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

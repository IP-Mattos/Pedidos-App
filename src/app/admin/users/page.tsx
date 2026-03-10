'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Search, Shield, Wrench, UserX, UserCheck, RefreshCw, Truck } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/hooks/use-auth'
import { ProfileService } from '@/lib/services/profile-services'
import { Profile } from '@/types/database'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'worker' | 'delivery'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ProfileService.getAllProfiles()
      setUsers(data)
    } catch {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'worker' | 'delivery') => {
    if (userId === profile?.id) {
      toast.error('No puedes cambiar tu propio rol')
      return
    }
    setUpdatingId(userId)
    try {
      await ProfileService.updateUserRole(userId, newRole)
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
      toast.success('Rol actualizado')
    } catch {
      toast.error('Error al actualizar rol')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleToggleActive = async (user: Profile & { is_active?: boolean }) => {
    if (user.id === profile?.id) {
      toast.error('No puedes desactivar tu propia cuenta')
      return
    }
    setUpdatingId(user.id)
    try {
      if (user.is_active === false) {
        await ProfileService.reactivateAccount(user.id)
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: true } : u)))
        toast.success('Usuario reactivado')
      } else {
        // Desactivar sin cerrar sesión del admin actual
        const supabase = (await import('@/lib/supabase/client')).createClient()
        await supabase
          .from('profiles')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', user.id)
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: false } : u)))
        toast.success('Usuario desactivado')
      }
    } catch {
      toast.error('Error al actualizar usuario')
    } finally {
      setUpdatingId(null)
    }
  }

  if (profile?.role !== 'admin') {
    return (
      <MainLayout>
        <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Acceso Denegado</h1>
          <p className='text-gray-600'>No tienes permisos para ver esta página.</p>
        </div>
      </MainLayout>
    )
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    workers: users.filter((u) => u.role === 'worker').length,
    delivery: users.filter((u) => u.role === 'delivery').length,
    inactive: users.filter((u) => (u as Profile & { is_active?: boolean }).is_active === false).length
  }

  return (
    <MainLayout>
      <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Gestión de Usuarios</h1>
            <p className='mt-2 text-gray-600'>Administra roles y acceso de los usuarios del sistema</p>
          </div>
          <button
            onClick={loadUsers}
            disabled={loading}
            className='flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50'
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Estadísticas */}
        <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mb-8'>
          <div className='bg-white shadow rounded-lg p-5'>
            <div className='flex items-center'>
              <Users className='h-6 w-6 text-gray-400' />
              <div className='ml-4'>
                <p className='text-sm text-gray-500'>Total</p>
                <p className='text-2xl font-semibold text-gray-900'>{stats.total}</p>
              </div>
            </div>
          </div>
          <div className='bg-white shadow rounded-lg p-5'>
            <div className='flex items-center'>
              <Shield className='h-6 w-6 text-red-500' />
              <div className='ml-4'>
                <p className='text-sm text-gray-500'>Admins</p>
                <p className='text-2xl font-semibold text-gray-900'>{stats.admins}</p>
              </div>
            </div>
          </div>
          <div className='bg-white shadow rounded-lg p-5'>
            <div className='flex items-center'>
              <Wrench className='h-6 w-6 text-blue-500' />
              <div className='ml-4'>
                <p className='text-sm text-gray-500'>Trabajadores</p>
                <p className='text-2xl font-semibold text-gray-900'>{stats.workers}</p>
              </div>
            </div>
          </div>
          <div className='bg-white shadow rounded-lg p-5'>
            <div className='flex items-center'>
              <Truck className='h-6 w-6 text-orange-500' />
              <div className='ml-4'>
                <p className='text-sm text-gray-500'>Delivery</p>
                <p className='text-2xl font-semibold text-gray-900'>{stats.delivery}</p>
              </div>
            </div>
          </div>
          <div className='bg-white shadow rounded-lg p-5'>
            <div className='flex items-center'>
              <UserX className='h-6 w-6 text-gray-400' />
              <div className='ml-4'>
                <p className='text-sm text-gray-500'>Inactivos</p>
                <p className='text-2xl font-semibold text-gray-900'>{stats.inactive}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className='bg-white shadow rounded-lg p-4 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
              <input
                type='text'
                placeholder='Buscar por nombre o email...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'worker' | 'delivery')}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm'
            >
              <option value='all'>Todos los roles</option>
              <option value='admin'>Administradores</option>
              <option value='worker'>Trabajadores</option>
              <option value='delivery'>Delivery</option>
            </select>
          </div>
        </div>

        {/* Tabla de usuarios */}
        {loading ? (
          <LoadingSpinner message='Cargando usuarios...' />
        ) : filteredUsers.length === 0 ? (
          <div className='text-center py-12'>
            <Users className='mx-auto h-12 w-12 text-gray-400' />
            <h3 className='mt-2 text-sm font-medium text-gray-900'>No hay usuarios</h3>
            <p className='mt-1 text-sm text-gray-500'>No se encontraron usuarios con esos filtros.</p>
          </div>
        ) : (
          <div className='bg-white shadow rounded-lg overflow-hidden'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Usuario
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Rol
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Estado
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Registrado
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {filteredUsers.map((user) => {
                  const extUser = user as Profile & { is_active?: boolean }
                  const isActive = extUser.is_active !== false
                  const isCurrentUser = user.id === profile?.id
                  const isUpdating = updatingId === user.id

                  return (
                    <tr key={user.id} className={!isActive ? 'bg-gray-50 opacity-60' : ''}>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <div className='h-9 w-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0'>
                            <span className='text-sm font-medium text-red-700'>
                              {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className='ml-4'>
                            <div className='text-sm font-medium text-gray-900 flex items-center gap-2'>
                              {user.full_name}
                              {isCurrentUser && (
                                <span className='text-xs text-gray-400 font-normal'>(tú)</span>
                              )}
                            </div>
                            <div className='text-sm text-gray-500'>{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as 'admin' | 'worker' | 'delivery')}
                          disabled={isCurrentUser || isUpdating}
                          className='text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          <option value='worker'>Trabajador</option>
                          <option value='admin'>Administrador</option>
                          <option value='delivery'>Delivery</option>
                        </select>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right'>
                        <button
                          onClick={() => handleToggleActive(extUser)}
                          disabled={isCurrentUser || isUpdating}
                          title={isActive ? 'Desactivar usuario' : 'Reactivar usuario'}
                          className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded border disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                            isActive
                              ? 'border-red-300 text-red-700 hover:bg-red-50'
                              : 'border-green-300 text-green-700 hover:bg-green-50'
                          }`}
                        >
                          {isUpdating ? (
                            <RefreshCw className='h-3.5 w-3.5 animate-spin' />
                          ) : isActive ? (
                            <>
                              <UserX className='h-3.5 w-3.5 mr-1' />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <UserCheck className='h-3.5 w-3.5 mr-1' />
                              Reactivar
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

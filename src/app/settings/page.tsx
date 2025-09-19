'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  User,
  Mail,
  Shield,
  Bell,
  Palette,
  Trash2,
  Save,
  Loader2,
  BarChart3,
  CheckCircle,
  Clock,
  Package,
  Settings as SettingsIcon,
  Edit2,
  Lock
} from 'lucide-react'
import { z } from 'zod'
import Link from 'next/link'

import { MainLayout } from '@/components/layout/main-layout'
import { useAuth } from '@/hooks/use-auth'

// Esquemas de validación
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark']),
  notifications_enabled: z.boolean(),
  email_notifications: z.boolean(),
  language: z.string()
})

const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres')
})

type PreferencesFormData = z.infer<typeof preferencesSchema>
type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>

interface UserStats {
  totalAssigned: number
  completed: number
  inProgress: number
  totalUpdates: number
  completionRate: number
}

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [userStats] = useState<UserStats>({
    totalAssigned: 12,
    completed: 8,
    inProgress: 3,
    totalUpdates: 25,
    completionRate: 67
  })

  // Formulario para preferencias
  const {
    register: registerPreferences,
    handleSubmit: handleSubmitPreferences,
    formState: { errors: preferencesErrors }
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      theme: 'light',
      notifications_enabled: true,
      email_notifications: true,
      language: 'es'
    }
  })

  // Formulario para perfil
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: profile?.full_name || ''
    }
  })

  // Actualizar valores por defecto cuando cambie el perfil
  useEffect(() => {
    if (profile) {
      resetProfile({ full_name: profile.full_name })
    }
  }, [profile, resetProfile])

  const onUpdatePreferences = async (data: PreferencesFormData) => {
    setIsLoading(true)
    try {
      // Simular actualización de preferencias
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Preferencias actualizadas')
    } catch (error) {
      toast.error('Error al actualizar preferencias')
    } finally {
      setIsLoading(false)
    }
  }

  const onUpdateProfile = async (data: ProfileUpdateFormData) => {
    setIsLoading(true)
    try {
      // Simular actualización de perfil
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsEditingProfile(false)
      toast.success('Perfil actualizado')
      await refreshProfile()
    } catch (error) {
      toast.error('Error al actualizar perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivateAccount = async () => {
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres desactivar tu cuenta? Esta acción se puede revertir contactando soporte.'
    )

    if (!confirmed) return

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('Cuenta desactivada. Serás redirigido al login.')
      // Redirigir después de un momento
      setTimeout(() => (window.location.href = '/login'), 2000)
    } catch (error) {
      toast.error('Error al desactivar cuenta')
    }
  }

  if (!user || !profile) {
    return (
      <MainLayout>
        <div className='max-w-6xl mx-auto py-6 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-2 text-gray-600'>Cargando configuración...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  const tabs = [
    { id: 'profile', name: 'Mi Perfil', icon: User },
    { id: 'preferences', name: 'Preferencias', icon: Palette },
    { id: 'notifications', name: 'Notificaciones', icon: Bell },
    ...(profile.role === 'worker' ? [{ id: 'stats', name: 'Estadísticas', icon: BarChart3 }] : []),
    { id: 'security', name: 'Seguridad', icon: Shield }
  ]

  return (
    <MainLayout>
      <div className='max-w-6xl mx-auto py-6 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center space-x-3'>
            <SettingsIcon className='h-8 w-8 text-gray-400' />
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Configuración</h1>
              <p className='mt-1 text-gray-600'>Gestiona tu perfil, preferencias y configuración de la cuenta</p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          {/* Sidebar de navegación */}
          <div className='lg:col-span-1'>
            <nav className='space-y-2'>
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <Icon className='h-5 w-5 mr-3' />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Contenido principal */}
          <div className='lg:col-span-3'>
            {/* Tab: Perfil */}
            {activeTab === 'profile' && (
              <div className='space-y-6'>
                {/* Información del perfil */}
                <div className='bg-white shadow rounded-lg p-6'>
                  <div className='flex items-center justify-between mb-6'>
                    <h2 className='text-lg font-medium text-gray-900'>Información Personal</h2>
                    {!isEditingProfile && (
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className='flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50'
                      >
                        <Edit2 className='h-4 w-4 mr-2' />
                        Editar
                      </button>
                    )}
                  </div>

                  {isEditingProfile ? (
                    <form onSubmit={handleSubmitProfile(onUpdateProfile)} className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Nombre Completo</label>
                        <input
                          type='text'
                          {...registerProfile('full_name')}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                          placeholder='Tu nombre completo'
                        />
                        {profileErrors.full_name && (
                          <p className='mt-1 text-sm text-red-600'>{profileErrors.full_name.message}</p>
                        )}
                      </div>

                      <div className='flex space-x-3'>
                        <button
                          type='submit'
                          disabled={isLoading}
                          className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save className='h-4 w-4 mr-2' />
                              Guardar
                            </>
                          )}
                        </button>
                        <button
                          type='button'
                          onClick={() => setIsEditingProfile(false)}
                          className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className='space-y-6'>
                      {/* Avatar y información básica */}
                      <div className='flex items-center space-x-6'>
                        <div className='h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center'>
                          <User className='h-10 w-10 text-white' />
                        </div>
                        <div>
                          <h3 className='text-xl font-semibold text-gray-900'>{profile.full_name}</h3>
                          <p className='text-gray-600'>{user.email}</p>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              profile.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {profile.role === 'admin' ? '👑 Administrador' : '👷 Trabajador'}
                          </span>
                        </div>
                      </div>

                      {/* Información de la cuenta */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='space-y-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700'>ID de Usuario</label>
                            <p className='mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded'>
                              {user.id.slice(0, 8)}...
                            </p>
                          </div>

                          <div>
                            <label className='block text-sm font-medium text-gray-700'>Fecha de Registro</label>
                            <p className='mt-1 text-sm text-gray-900'>
                              {new Date(profile.created_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className='space-y-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700'>Estado de Verificación</label>
                            <span className='mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                              <CheckCircle className='h-3 w-3 mr-1' />
                              Email Verificado
                            </span>
                          </div>

                          <div>
                            <label className='block text-sm font-medium text-gray-700'>Última Actualización</label>
                            <p className='mt-1 text-sm text-gray-900'>
                              {new Date(profile.updated_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Acceso rápido a cambio de contraseña */}
                <div className='bg-amber-50 border border-amber-200 rounded-lg p-6'>
                  <div className='flex items-start space-x-3'>
                    <Lock className='h-6 w-6 text-amber-600 mt-0.5' />
                    <div className='flex-1'>
                      <h3 className='text-sm font-medium text-amber-900'>Seguridad de la Cuenta</h3>
                      <p className='mt-1 text-sm text-amber-700'>
                        Mantén tu cuenta segura cambiando tu contraseña regularmente.
                      </p>
                      <div className='mt-3'>
                        <button
                          onClick={() => setActiveTab('security')}
                          className='text-sm font-medium text-amber-800 hover:text-amber-900'
                        >
                          Cambiar Contraseña →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Preferencias */}
            {activeTab === 'preferences' && (
              <div className='bg-white shadow rounded-lg p-6'>
                <h2 className='text-lg font-medium text-gray-900 mb-6'>Preferencias de la Aplicación</h2>

                <form onSubmit={handleSubmitPreferences(onUpdatePreferences)} className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Tema</label>
                      <select
                        {...registerPreferences('theme')}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        <option value='light'>🌞 Claro</option>
                        <option value='dark'>🌙 Oscuro</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Idioma</label>
                      <select
                        {...registerPreferences('language')}
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      >
                        <option value='es'>🇪🇸 Español</option>
                        <option value='en'>🇺🇸 English</option>
                      </select>
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <h3 className='text-sm font-medium text-gray-900'>Notificaciones</h3>
                    <div className='space-y-3'>
                      <div className='flex items-center'>
                        <input
                          type='checkbox'
                          {...registerPreferences('notifications_enabled')}
                          className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                        />
                        <label className='ml-3 block text-sm text-gray-700'>
                          Habilitar notificaciones en la aplicación
                        </label>
                      </div>

                      <div className='flex items-center'>
                        <input
                          type='checkbox'
                          {...registerPreferences('email_notifications')}
                          className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                        />
                        <label className='ml-3 block text-sm text-gray-700'>Recibir notificaciones por email</label>
                      </div>
                    </div>
                  </div>

                  <button
                    type='submit'
                    disabled={isLoading}
                    className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className='h-4 w-4 mr-2' />
                        Guardar Preferencias
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Tab: Notificaciones */}
            {activeTab === 'notifications' && (
              <div className='bg-white shadow rounded-lg p-6'>
                <h2 className='text-lg font-medium text-gray-900 mb-6'>Configuración de Notificaciones</h2>

                <div className='space-y-6'>
                  <div className='border-l-4 border-blue-500 pl-6 py-4 bg-blue-50'>
                    <h3 className='text-sm font-medium text-blue-900 mb-3'>📦 Notificaciones de Pedidos</h3>
                    <div className='space-y-3'>
                      <label className='flex items-center'>
                        <input
                          type='checkbox'
                          defaultChecked
                          className='h-4 w-4 text-blue-600 rounded border-gray-300'
                        />
                        <span className='ml-3 text-sm text-gray-700'>Nuevos pedidos asignados</span>
                      </label>
                      <label className='flex items-center'>
                        <input
                          type='checkbox'
                          defaultChecked
                          className='h-4 w-4 text-blue-600 rounded border-gray-300'
                        />
                        <span className='ml-3 text-sm text-gray-700'>Cambios de estado en mis pedidos</span>
                      </label>
                      <label className='flex items-center'>
                        <input type='checkbox' className='h-4 w-4 text-blue-600 rounded border-gray-300' />
                        <span className='ml-3 text-sm text-gray-700'>Recordatorios de fecha de entrega</span>
                      </label>
                    </div>
                  </div>

                  <div className='border-l-4 border-green-500 pl-6 py-4 bg-green-50'>
                    <h3 className='text-sm font-medium text-green-900 mb-3'>🔔 Notificaciones del Sistema</h3>
                    <div className='space-y-3'>
                      <label className='flex items-center'>
                        <input
                          type='checkbox'
                          defaultChecked
                          className='h-4 w-4 text-blue-600 rounded border-gray-300'
                        />
                        <span className='ml-3 text-sm text-gray-700'>Actualizaciones de la aplicación</span>
                      </label>
                      <label className='flex items-center'>
                        <input type='checkbox' className='h-4 w-4 text-blue-600 rounded border-gray-300' />
                        <span className='ml-3 text-sm text-gray-700'>Notificaciones de mantenimiento</span>
                      </label>
                      <label className='flex items-center'>
                        <input type='checkbox' className='h-4 w-4 text-blue-600 rounded border-gray-300' />
                        <span className='ml-3 text-sm text-gray-700'>Newsletters y novedades</span>
                      </label>
                    </div>
                  </div>

                  <button className='flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700'>
                    <Save className='h-4 w-4 mr-2' />
                    Guardar Configuración
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Estadísticas (solo para workers) */}
            {activeTab === 'stats' && profile.role === 'worker' && (
              <div className='bg-white shadow rounded-lg p-6'>
                <h2 className='text-lg font-medium text-gray-900 mb-6'>📊 Mis Estadísticas</h2>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                  <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
                    <div className='flex items-center'>
                      <Package className='h-8 w-8 text-blue-600' />
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-blue-900'>Total Asignados</p>
                        <p className='text-2xl font-bold text-blue-700'>{userStats.totalAssigned}</p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-green-50 rounded-lg p-4 border border-green-200'>
                    <div className='flex items-center'>
                      <CheckCircle className='h-8 w-8 text-green-600' />
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-green-900'>Completados</p>
                        <p className='text-2xl font-bold text-green-700'>{userStats.completed}</p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-yellow-50 rounded-lg p-4 border border-yellow-200'>
                    <div className='flex items-center'>
                      <Clock className='h-8 w-8 text-yellow-600' />
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-yellow-900'>En Proceso</p>
                        <p className='text-2xl font-bold text-yellow-700'>{userStats.inProgress}</p>
                      </div>
                    </div>
                  </div>

                  <div className='bg-purple-50 rounded-lg p-4 border border-purple-200'>
                    <div className='flex items-center'>
                      <BarChart3 className='h-8 w-8 text-purple-600' />
                      <div className='ml-4'>
                        <p className='text-sm font-medium text-purple-900'>Tasa de Éxito</p>
                        <p className='text-2xl font-bold text-purple-700'>{userStats.completionRate}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
                  <h3 className='text-sm font-medium text-gray-900 mb-2'>🏆 Rendimiento</h3>
                  <p className='text-sm text-gray-600'>
                    Has realizado <strong>{userStats.totalUpdates}</strong> actualizaciones de progreso. ¡Excelente
                    trabajo manteniendo informados a los clientes!
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Seguridad */}
            {activeTab === 'security' && (
              <div className='space-y-6'>
                <div className='bg-white shadow rounded-lg p-6'>
                  <h2 className='text-lg font-medium text-gray-900 mb-6'>🔐 Configuración de Seguridad</h2>

                  <div className='space-y-6'>
                    <div className='border-l-4 border-blue-500 pl-6 py-4 bg-blue-50'>
                      <h3 className='text-sm font-medium text-blue-900 mb-2'>Cambiar Contraseña</h3>
                      <p className='text-sm text-blue-700 mb-4'>
                        Actualiza tu contraseña para mantener tu cuenta segura.
                      </p>
                      <Link href='/reset-password'>
                        <button className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'>
                          <Lock className='h-4 w-4 mr-2' />
                          Cambiar Contraseña
                        </button>
                      </Link>
                    </div>

                    <div className='border-l-4 border-green-500 pl-6 py-4 bg-green-50'>
                      <h3 className='text-sm font-medium text-green-900 mb-2'>Actividad de la Cuenta</h3>
                      <div className='space-y-2 text-sm text-green-700'>
                        <p>
                          • Último acceso: <strong>Hoy a las 14:30</strong>
                        </p>
                        <p>
                          • Ubicación: <strong>Montevideo, Uruguay</strong>
                        </p>
                        <p>
                          • Dispositivo: <strong>Chrome en Windows</strong>
                        </p>
                      </div>
                    </div>

                    <div className='border-l-4 border-amber-500 pl-6 py-4 bg-amber-50'>
                      <h3 className='text-sm font-medium text-amber-900 mb-2'>Recomendaciones de Seguridad</h3>
                      <ul className='text-sm text-amber-700 space-y-1'>
                        <li>✅ Email verificado</li>
                        <li>✅ Contraseña fuerte</li>
                        <li>⚠️ Considera activar autenticación de dos factores</li>
                        <li>⚠️ Revisa regularmente tu actividad de cuenta</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Zona de peligro */}
                <div className='bg-white shadow rounded-lg p-6 border-l-4 border-red-500'>
                  <h2 className='text-lg font-medium text-red-900 mb-4'>⚠️ Zona de Peligro</h2>
                  <div className='bg-red-50 p-4 rounded-md'>
                    <h3 className='text-sm font-medium text-red-900 mb-2'>Desactivar Cuenta</h3>
                    <p className='text-sm text-red-700 mb-4'>
                      Esta acción desactivará temporalmente tu cuenta. Podrás reactivarla contactando a soporte.
                    </p>
                    <button
                      onClick={handleDeactivateAccount}
                      className='flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700'
                    >
                      <Trash2 className='h-4 w-4 mr-2' />
                      Desactivar Cuenta
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

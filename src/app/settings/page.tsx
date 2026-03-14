'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  User,
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
  Lock,
  Eye,
  EyeOff,
  Store
} from 'lucide-react'
import { z } from 'zod'

import { MainLayout } from '@/components/layout/main-layout'
import { useAuth } from '@/hooks/use-auth'
import { ProfileService } from '@/lib/services/profile-services'
import { useTheme } from '@/components/providers/theme-provider'
import { useBranding } from '@/hooks/use-branding'

// Esquemas de validación
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark']),
  notifications_enabled: z.boolean(),
  email_notifications: z.boolean(),
  language: z.string()
})

const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional()
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
    newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmá tu nueva contraseña')
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword']
  })

type PreferencesFormData = z.infer<typeof preferencesSchema>
type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

interface UserStats {
  totalAssigned: number
  completed: number
  inProgress: number
  totalUpdates: number
  completionRate: number
}

export default function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { setTheme } = useTheme()
  const { branding, saveBranding } = useBranding()
  const [activeTab, setActiveTab] = useState('profile')
  const [brandingForm, setBrandingForm] = useState({ businessName: '', subtitle: '', navColor: '' })
  const [brandingSaving, setBrandingSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [prefsLoading, setPrefsLoading] = useState(true)

  // Formulario para preferencias
  const {
    register: registerPreferences,
    handleSubmit: handleSubmitPreferences,
    reset: resetPreferences,
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
    defaultValues: { full_name: profile?.full_name || '', phone: profile?.phone || '' }
  })

  // Formulario para contraseña
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  })

  // Cargar preferencias guardadas
  useEffect(() => {
    if (!user) return
    setPrefsLoading(true)
    ProfileService.getUserPreferences(user.id)
      .then((prefs) => {
        if (prefs) {
          resetPreferences({
            theme: prefs.theme ?? 'light',
            notifications_enabled: prefs.notifications_enabled ?? true,
            email_notifications: prefs.email_notifications ?? true,
            language: prefs.language ?? 'es'
          })
        }
      })
      .catch(() => {/* use defaults */})
      .finally(() => setPrefsLoading(false))
  }, [user, resetPreferences])

  // Actualizar valores por defecto cuando cambie el perfil
  useEffect(() => {
    if (profile) resetProfile({ full_name: profile.full_name, phone: profile.phone || '' })
  }, [profile, resetProfile])

  // Sincronizar brandingForm con el hook al montar
  useEffect(() => {
    setBrandingForm({ businessName: branding.businessName, subtitle: branding.subtitle, navColor: branding.navColor })
  }, [branding.businessName, branding.subtitle, branding.navColor])

  // Cargar estadísticas cuando se abre la tab
  useEffect(() => {
    if (activeTab !== 'stats' || !user || profile?.role !== 'worker') return
    setStatsLoading(true)
    ProfileService.getUserStats(user.id)
      .then(setUserStats)
      .catch(() => toast.error('Error al cargar estadísticas'))
      .finally(() => setStatsLoading(false))
  }, [activeTab, user, profile?.role])

  const onUpdatePreferences = async (data: PreferencesFormData) => {
    if (!user) return
    setIsLoading(true)
    try {
      await ProfileService.updateUserPreferences(user.id, data)
      setTheme(data.theme)
      toast.success('Preferencias actualizadas')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar preferencias')
    } finally {
      setIsLoading(false)
    }
  }

  const onUpdateProfile = async (data: ProfileUpdateFormData) => {
    if (!user) return
    setIsLoading(true)
    try {
      await ProfileService.updateProfile(user.id, { full_name: data.full_name, phone: data.phone || null })
      setIsEditingProfile(false)
      toast.success('Perfil actualizado')
      await refreshProfile()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const onChangePassword = async (data: PasswordFormData) => {
    setIsLoading(true)
    try {
      await ProfileService.changePassword(data.currentPassword, data.newPassword)
      toast.success('Contraseña actualizada exitosamente')
      resetPassword()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cambiar contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivateAccount = async () => {
    if (!user) return
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres desactivar tu cuenta? Esta acción se puede revertir contactando soporte.'
    )
    if (!confirmed) return

    try {
      await ProfileService.deactivateAccount(user.id)
      toast.success('Cuenta desactivada.')
      await signOut()
      window.location.href = '/login'
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al desactivar cuenta')
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
    ...(profile.role === 'admin' ? [{ id: 'branding', name: 'Marca', icon: Store }] : []),
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
          {/* Sidebar */}
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

          {/* Contenido */}
          <div className='lg:col-span-3'>

            {/* Tab: Perfil */}
            {activeTab === 'profile' && (
              <div className='space-y-6'>
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

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Teléfono</label>
                        <input
                          type='tel'
                          {...registerProfile('phone')}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                          placeholder='Ej: 099 123 456'
                        />
                      </div>

                      <div className='flex space-x-3'>
                        <button
                          type='submit'
                          disabled={isLoading}
                          className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                        >
                          {isLoading ? (
                            <><Loader2 className='h-4 w-4 mr-2 animate-spin' />Guardando...</>
                          ) : (
                            <><Save className='h-4 w-4 mr-2' />Guardar</>
                          )}
                        </button>
                        <button
                          type='button'
                          onClick={() => { setIsEditingProfile(false); resetProfile({ full_name: profile.full_name }) }}
                          className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className='space-y-6'>
                      <div className='flex items-center space-x-6'>
                        <div className='h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center'>
                          <User className='h-10 w-10 text-white' />
                        </div>
                        <div>
                          <h3 className='text-xl font-semibold text-gray-900'>{profile.full_name}</h3>
                          <p className='text-gray-600'>{user.email}</p>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              profile.role === 'admin' ? 'bg-purple-100 text-purple-800' : profile.role === 'delivery' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {profile.role === 'admin' ? '👑 Administrador' : profile.role === 'delivery' ? '🚚 Delivery' : '👷 Trabajador'}
                          </span>
                        </div>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div className='space-y-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700'>ID de Usuario</label>
                            <p className='mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded'>
                              {user.id.slice(0, 8)}...
                            </p>
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700'>Teléfono</label>
                            <p className='mt-1 text-sm text-gray-900'>
                              {profile.phone ? (
                                <a
                                  href={`https://wa.me/${profile.phone.replace(/\D/g, '').replace(/^0/, '598')}`}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='text-green-600 hover:underline'
                                >
                                  {profile.phone}
                                </a>
                              ) : (
                                <span className='text-gray-400 italic'>No cargado</span>
                              )}
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

                {prefsLoading ? (
                  <div className='flex justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500' />
                  </div>
                ) : (
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
                        <><Loader2 className='h-4 w-4 mr-2 animate-spin' />Guardando...</>
                      ) : (
                        <><Save className='h-4 w-4 mr-2' />Guardar Preferencias</>
                      )}
                    </button>
                  </form>
                )}
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
                        <input type='checkbox' defaultChecked className='h-4 w-4 text-blue-600 rounded border-gray-300' />
                        <span className='ml-3 text-sm text-gray-700'>Nuevos pedidos asignados</span>
                      </label>
                      <label className='flex items-center'>
                        <input type='checkbox' defaultChecked className='h-4 w-4 text-blue-600 rounded border-gray-300' />
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
                        <input type='checkbox' defaultChecked className='h-4 w-4 text-blue-600 rounded border-gray-300' />
                        <span className='ml-3 text-sm text-gray-700'>Actualizaciones de la aplicación</span>
                      </label>
                      <label className='flex items-center'>
                        <input type='checkbox' className='h-4 w-4 text-blue-600 rounded border-gray-300' />
                        <span className='ml-3 text-sm text-gray-700'>Notificaciones de mantenimiento</span>
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={() => toast.success('Configuración de notificaciones guardada')}
                    className='flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700'
                  >
                    <Save className='h-4 w-4 mr-2' />
                    Guardar Configuración
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Estadísticas (solo workers) */}
            {activeTab === 'stats' && profile.role === 'worker' && (
              <div className='bg-white shadow rounded-lg p-6'>
                <h2 className='text-lg font-medium text-gray-900 mb-6'>📊 Mis Estadísticas</h2>

                {statsLoading ? (
                  <div className='flex justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500' />
                  </div>
                ) : userStats ? (
                  <>
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
                  </>
                ) : (
                  <p className='text-sm text-gray-500 text-center py-6'>No se pudieron cargar las estadísticas.</p>
                )}
              </div>
            )}

            {/* Tab: Marca (solo admin) */}
            {activeTab === 'branding' && profile.role === 'admin' && (
              <div className='bg-white shadow rounded-lg p-6'>
                <h2 className='text-lg font-medium text-gray-900 mb-1'>Personalización de Marca</h2>
                <p className='text-sm text-gray-500 mb-6'>Cambiá el nombre del negocio, el subtítulo y el color de la barra de navegación.</p>

                <div className='space-y-5 max-w-md'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Nombre del negocio</label>
                    <input
                      type='text'
                      value={brandingForm.businessName}
                      onChange={(e) => setBrandingForm((f) => ({ ...f, businessName: e.target.value }))}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Patricia'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Subtítulo</label>
                    <input
                      type='text'
                      value={brandingForm.subtitle}
                      onChange={(e) => setBrandingForm((f) => ({ ...f, subtitle: e.target.value }))}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Autoservice'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Color de la barra</label>
                    <div className='flex items-center gap-3'>
                      <input
                        type='color'
                        value={brandingForm.navColor}
                        onChange={(e) => setBrandingForm((f) => ({ ...f, navColor: e.target.value }))}
                        className='h-10 w-16 cursor-pointer rounded border border-gray-300 p-0.5'
                      />
                      <input
                        type='text'
                        value={brandingForm.navColor}
                        onChange={(e) => setBrandingForm((f) => ({ ...f, navColor: e.target.value }))}
                        className='w-32 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                        placeholder='#9f1239'
                      />
                      <div
                        className='h-10 flex-1 rounded-md border border-gray-200'
                        style={{ background: `linear-gradient(to right, ${brandingForm.navColor}, color-mix(in srgb, ${brandingForm.navColor} 80%, white))` }}
                      />
                    </div>
                  </div>

                  <button
                    disabled={brandingSaving}
                    onClick={async () => {
                      setBrandingSaving(true)
                      try {
                        saveBranding({ businessName: brandingForm.businessName.trim() || 'Patricia', subtitle: brandingForm.subtitle.trim() || 'Autoservice', navColor: brandingForm.navColor || '#9f1239' })
                        toast.success('Marca actualizada')
                      } finally {
                        setBrandingSaving(false)
                      }
                    }}
                    className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                  >
                    {brandingSaving ? (
                      <><Loader2 className='h-4 w-4 mr-2 animate-spin' />Guardando...</>
                    ) : (
                      <><Save className='h-4 w-4 mr-2' />Guardar Marca</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Seguridad */}
            {activeTab === 'security' && (
              <div className='space-y-6'>
                {/* Cambiar contraseña */}
                <div className='bg-white shadow rounded-lg p-6'>
                  <h2 className='text-lg font-medium text-gray-900 mb-6'>🔐 Cambiar Contraseña</h2>

                  <form onSubmit={handleSubmitPassword(onChangePassword)} className='space-y-4 max-w-md'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Contraseña actual</label>
                      <div className='relative'>
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          {...registerPassword('currentPassword')}
                          className='w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                          placeholder='Tu contraseña actual'
                        />
                        <button
                          type='button'
                          onClick={() => setShowCurrentPassword((v) => !v)}
                          className='absolute right-3 top-2.5 text-gray-400 hover:text-gray-600'
                        >
                          {showCurrentPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className='mt-1 text-sm text-red-600'>{passwordErrors.currentPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Nueva contraseña</label>
                      <div className='relative'>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          {...registerPassword('newPassword')}
                          className='w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                          placeholder='Mínimo 6 caracteres'
                        />
                        <button
                          type='button'
                          onClick={() => setShowNewPassword((v) => !v)}
                          className='absolute right-3 top-2.5 text-gray-400 hover:text-gray-600'
                        >
                          {showNewPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className='mt-1 text-sm text-red-600'>{passwordErrors.newPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Confirmar nueva contraseña</label>
                      <div className='relative'>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...registerPassword('confirmPassword')}
                          className='w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                          placeholder='Repetí la nueva contraseña'
                        />
                        <button
                          type='button'
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className='absolute right-3 top-2.5 text-gray-400 hover:text-gray-600'
                        >
                          {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className='mt-1 text-sm text-red-600'>{passwordErrors.confirmPassword.message}</p>
                      )}
                    </div>

                    <button
                      type='submit'
                      disabled={isLoading}
                      className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                    >
                      {isLoading ? (
                        <><Loader2 className='h-4 w-4 mr-2 animate-spin' />Guardando...</>
                      ) : (
                        <><Lock className='h-4 w-4 mr-2' />Cambiar Contraseña</>
                      )}
                    </button>
                  </form>
                </div>

                {/* Recomendaciones */}
                <div className='bg-white shadow rounded-lg p-6'>
                  <h2 className='text-lg font-medium text-gray-900 mb-4'>Recomendaciones de Seguridad</h2>
                  <ul className='text-sm text-gray-700 space-y-2'>
                    <li>✅ Email verificado</li>
                    <li>⚠️ Cambiá tu contraseña regularmente</li>
                    <li>⚠️ Usá una contraseña única para esta aplicación</li>
                  </ul>
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

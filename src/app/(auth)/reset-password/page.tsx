'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Lock, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

import { AuthForm } from '@/components/auth/auth-form'
import { AuthService } from '@/lib/auth/auth-service'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth'

// Componente interno que usa useSearchParams
function ResetPasswordContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  })

  const password = watch('password')

  // Verificar si hay un token de reset válido
  useEffect(() => {
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      toast.error(errorDescription || 'El enlace de restablecimiento es inválido o ha expirado')
      router.push('/forgot-password')
    }
  }, [searchParams, router])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    try {
      await AuthService.resetPassword(data)
      setPasswordResetSuccess(true)
      toast.success('¡Contraseña actualizada exitosamente!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar contraseña'

      if (errorMessage.includes('session_not_found')) {
        toast.error('El enlace ha expirado. Solicita uno nuevo.')
        router.push('/forgot-password')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: '', color: '' }

    let strength = 0
    if (password.length >= 6) strength += 1
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/\d/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    if (strength <= 2) return { strength, text: 'Débil', color: 'bg-red-500' }
    if (strength <= 4) return { strength, text: 'Media', color: 'bg-yellow-500' }
    return { strength, text: 'Fuerte', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(password || '')

  if (passwordResetSuccess) {
    return (
      <AuthForm
        title='¡Contraseña Actualizada!'
        subtitle='Tu nueva contraseña ha sido guardada exitosamente'
        footer={
          <Link
            href='/login'
            className='inline-flex items-center text-sm text-blue-600 hover:text-blue-500 transition-colors'
          >
            Continuar al login
          </Link>
        }
      >
        <div className='text-center space-y-6'>
          {/* Icono de éxito */}
          <div className='mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
            <CheckCircle className='h-8 w-8 text-green-600' />
          </div>

          {/* Mensaje principal */}
          <div className='space-y-2'>
            <p className='text-green-600 font-medium'>¡Perfecto! Tu contraseña ha sido actualizada.</p>
            <p className='text-gray-600'>Ahora puedes iniciar sesión con tu nueva contraseña.</p>
          </div>

          {/* Recomendaciones de seguridad */}
          <div className='bg-blue-50 border border-blue-200 rounded-md p-4'>
            <div className='text-left'>
              <h3 className='text-sm font-medium text-blue-900 mb-2'>💡 Consejos de seguridad:</h3>
              <ul className='text-sm text-blue-800 space-y-1'>
                <li>• Usa una contraseña única para esta cuenta</li>
                <li>• No compartas tu contraseña con nadie</li>
                <li>• Considera usar un gestor de contraseñas</li>
                <li>• Cierra sesión en dispositivos compartidos</li>
              </ul>
            </div>
          </div>

          {/* Botón para continuar */}
          <Link href='/login'>
            <button className='w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors'>
              Iniciar Sesión
            </button>
          </Link>
        </div>
      </AuthForm>
    )
  }

  return (
    <AuthForm
      title='Nueva Contraseña'
      subtitle='Crea una contraseña segura para tu cuenta'
      footer={
        <div className='space-y-2'>
          <p className='text-sm text-gray-600'>
            ¿Recordaste tu contraseña?{' '}
            <Link href='/login' className='font-medium text-blue-600 hover:text-blue-500 transition-colors'>
              Iniciar sesión
            </Link>
          </p>
          <Link
            href='/forgot-password'
            className='inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors'
          >
            Solicitar nuevo enlace
          </Link>
        </div>
      }
    >
      <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
        {/* Información de seguridad */}
        <div className='bg-amber-50 border border-amber-200 rounded-md p-4'>
          <div className='flex'>
            <AlertTriangle className='h-5 w-5 text-amber-500 mt-0.5 mr-2' />
            <div className='text-sm text-amber-800'>
              <p className='font-medium'>Creando una nueva contraseña</p>
              <p className='mt-1'>
                Esta acción reemplazará tu contraseña actual. Asegúrate de usar una contraseña segura.
              </p>
            </div>
          </div>
        </div>

        {/* Nueva Contraseña */}
        <div>
          <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-2'>
            Nueva Contraseña
          </label>
          <div className='relative'>
            <input
              id='password'
              type={showPassword ? 'text' : 'password'}
              autoComplete='new-password'
              placeholder='••••••••'
              className='w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              {...register('password')}
            />
            <Lock className='h-5 w-5 text-gray-400 absolute left-3 top-3' />
            <button
              type='button'
              className='absolute right-3 top-3 hover:text-gray-600'
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className='h-5 w-5 text-gray-400' /> : <Eye className='h-5 w-5 text-gray-400' />}
            </button>
          </div>

          {/* Indicador de fortaleza */}
          {password && (
            <div className='mt-2 space-y-2'>
              <div className='text-sm text-gray-600'>
                Fortaleza:{' '}
                <span
                  className={
                    passwordStrength.strength >= 4
                      ? 'text-green-600'
                      : passwordStrength.strength >= 3
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }
                >
                  {passwordStrength.text}
                </span>
              </div>
              <div className='flex space-x-1'>
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded ${
                      i < passwordStrength.strength ? passwordStrength.color : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {errors.password && <p className='mt-1 text-sm text-red-600'>{errors.password.message}</p>}
        </div>

        {/* Confirmar Contraseña */}
        <div>
          <label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700 mb-2'>
            Confirmar Nueva Contraseña
          </label>
          <div className='relative'>
            <input
              id='confirmPassword'
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete='new-password'
              placeholder='••••••••'
              className='w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              {...register('confirmPassword')}
            />
            <Lock className='h-5 w-5 text-gray-400 absolute left-3 top-3' />
            <button
              type='button'
              className='absolute right-3 top-3 hover:text-gray-600'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className='h-5 w-5 text-gray-400' />
              ) : (
                <Eye className='h-5 w-5 text-gray-400' />
              )}
            </button>
          </div>
          {errors.confirmPassword && <p className='mt-1 text-sm text-red-600'>{errors.confirmPassword.message}</p>}
        </div>

        {/* Botón */}
        <button
          type='submit'
          disabled={isLoading}
          className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          {isLoading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Actualizando contraseña...
            </>
          ) : (
            <>
              <Lock className='mr-2 h-4 w-4' />
              Actualizar Contraseña
            </>
          )}
        </button>

        {/* Seguridad */}
        <div className='text-xs text-gray-500 text-center'>
          <p>🔒 Tu nueva contraseña será encriptada y almacenada de forma segura.</p>
        </div>
      </form>
    </AuthForm>
  )
}

// Componente principal con Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthForm title='Cargando...' subtitle='Por favor espera'>
          <div className='flex justify-center items-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
          </div>
        </AuthForm>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'

import { AuthForm } from '@/components/auth/auth-form'
import { AuthService } from '@/lib/auth/auth-service'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const result = await AuthService.login(data)

      if (result.user) {
        // Verificar si el email está confirmado
        if (!result.user.email_confirmed_at) {
          toast.error('Por favor verifica tu email antes de iniciar sesión')
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
          return
        }

        toast.success('¡Bienvenido!')
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión'

      // Mensajes de error más amigables
      if (errorMessage.includes('Invalid login credentials')) {
        toast.error('Email o contraseña incorrectos')
      } else if (errorMessage.includes('Email not confirmed')) {
        toast.error('Por favor verifica tu email antes de iniciar sesión')
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
      } else if (errorMessage.includes('Too many requests')) {
        toast.error('Demasiados intentos. Espera unos minutos e intenta de nuevo')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthForm
      title='Iniciar Sesión'
      subtitle='Accede a tu cuenta'
      footer={
        <div className='space-y-2'>
          <p className='text-sm text-gray-600'>
            ¿No tienes una cuenta?{' '}
            <Link href='/register' className='font-medium text-blue-600 hover:text-blue-500 transition-colors'>
              Regístrate aquí
            </Link>
          </p>
          <p className='text-sm text-gray-500'>
            ¿Problemas para acceder?{' '}
            <Link href='/forgot-password' className='font-medium text-blue-600 hover:text-blue-500 transition-colors'>
              Recuperar contraseña
            </Link>
          </p>
        </div>
      }
    >
      <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
        {/* Email */}
        <div>
          <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
            Email
          </label>
          <div className='relative'>
            <input
              id='email'
              type='email'
              autoComplete='email'
              placeholder='tu@email.com'
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              {...register('email')}
            />
            <Mail className='h-5 w-5 text-gray-400 absolute left-3 top-3' />
          </div>
          {errors.email && <p className='mt-1 text-sm text-red-600'>{errors.email.message}</p>}
        </div>

        {/* Contraseña */}
        <div>
          <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-2'>
            Contraseña
          </label>
          <div className='relative'>
            <input
              id='password'
              type={showPassword ? 'text' : 'password'}
              autoComplete='current-password'
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
          {errors.password && <p className='mt-1 text-sm text-red-600'>{errors.password.message}</p>}
        </div>

        {/* Recordar sesión y olvidé contraseña */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <input
              id='remember-me'
              name='remember-me'
              type='checkbox'
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            />
            <label htmlFor='remember-me' className='ml-2 block text-sm text-gray-700'>
              Recordar sesión
            </label>
          </div>

          <div className='text-sm'>
            <Link href='/forgot-password' className='font-medium text-blue-600 hover:text-blue-500 transition-colors'>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        {/* Botón de login */}
        <button
          type='submit'
          disabled={isLoading}
          className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          {isLoading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Iniciando sesión...
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </button>

        {/* Demo credentials (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <div className='bg-gray-50 border border-gray-200 rounded-md p-4'>
            <h3 className='text-sm font-medium text-gray-900 mb-2'>Credenciales de prueba:</h3>
            <div className='text-sm text-gray-600 space-y-1'>
              <p>
                <strong>Email:</strong> ipmattoscontactos@gmail.com
              </p>
              <p>
                <strong>Contraseña:</strong> [la que usaste al registrarte]
              </p>
            </div>
            <button
              type='button'
              onClick={() => {
                // Auto-rellenar campos para testing
                const emailInput = document.getElementById('email') as HTMLInputElement
                const passwordInput = document.getElementById('password') as HTMLInputElement
                if (emailInput) emailInput.value = 'ipmattoscontactos@gmail.com'
                if (passwordInput) passwordInput.value = 'Test123!' // Ajusta según tu contraseña
              }}
              className='mt-2 text-xs text-blue-600 hover:text-blue-500'
            >
              Auto-rellenar campos
            </button>
          </div>
        )}
      </form>
    </AuthForm>
  )
}

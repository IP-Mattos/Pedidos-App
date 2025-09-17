'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from 'lucide-react'

import { AuthForm } from '@/components/auth/auth-form'
import { AuthService } from '@/lib/auth/auth-service'
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth'

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const result = await AuthService.register(data)

      if (result.user && !result.user.email_confirmed_at) {
        toast.success('¡Cuenta creada! Te hemos enviado un email de verificación.')
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
      } else {
        toast.success('¡Cuenta creada exitosamente!')
        router.push('/')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la cuenta'

      if (errorMessage.includes('already registered')) {
        toast.error('Este email ya está registrado. ¿Quieres iniciar sesión?')
      } else if (errorMessage.includes('Password should be')) {
        toast.error('La contraseña debe tener al menos 6 caracteres')
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

  return (
    <AuthForm
      title='Crear Cuenta'
      subtitle='Únete al sistema de pedidos'
      footer={
        <p className='text-sm text-gray-600'>
          ¿Ya tienes una cuenta?{' '}
          <Link href='/login' className='font-medium text-blue-600 hover:text-blue-500 transition-colors'>
            Inicia sesión aquí
          </Link>
        </p>
      }
    >
      <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
        {/* Nombre Completo */}
        <div>
          <label htmlFor='fullName' className='block text-sm font-medium text-gray-700 mb-2'>
            Nombre Completo
          </label>
          <div className='relative'>
            <input
              id='fullName'
              type='text'
              autoComplete='name'
              placeholder='Tu nombre completo'
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              {...register('fullName')}
            />
            <User className='h-5 w-5 text-gray-400 absolute left-3 top-3' />
          </div>
          {errors.fullName && <p className='mt-1 text-sm text-red-600'>{errors.fullName.message}</p>}
        </div>

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
            Confirmar Contraseña
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

        {/* Términos */}
        <div className='text-sm text-gray-600 bg-gray-50 p-3 rounded-md'>
          <p>
            Al registrarte, aceptas nuestros{' '}
            <Link href='/terms' className='text-blue-600 hover:text-blue-500'>
              Términos de Servicio
            </Link>{' '}
            y{' '}
            <Link href='/privacy' className='text-blue-600 hover:text-blue-500'>
              Política de Privacidad
            </Link>
          </p>
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
              Creando cuenta...
            </>
          ) : (
            'Crear Cuenta'
          )}
        </button>
      </form>
    </AuthForm>
  )
}

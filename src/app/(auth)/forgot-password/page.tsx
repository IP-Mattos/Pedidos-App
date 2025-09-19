'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'

import { AuthForm } from '@/components/auth/auth-form'
import { AuthService } from '@/lib/auth/auth-service'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      await AuthService.forgotPassword(data)
      setSentEmail(data.email)
      setEmailSent(true)
      toast.success('Email de recuperación enviado')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar email'

      if (errorMessage.includes('User not found')) {
        toast.error('No hay ninguna cuenta asociada a este email')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <AuthForm
        title='Email Enviado'
        subtitle='Revisa tu bandeja de entrada'
        footer={
          <div className='space-y-2'>
            <p className='text-sm text-gray-600'>
              ¿No recibiste el email?{' '}
              <button
                onClick={() => {
                  setEmailSent(false)
                  setSentEmail('')
                }}
                className='font-medium text-blue-600 hover:text-blue-500 transition-colors'
              >
                Intentar de nuevo
              </button>
            </p>
            <Link
              href='/login'
              className='inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors'
            >
              <ArrowLeft className='h-4 w-4 mr-1' />
              Volver al login
            </Link>
          </div>
        }
      >
        <div className='text-center space-y-6'>
          {/* Icono de éxito */}
          <div className='mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
            <CheckCircle className='h-8 w-8 text-green-600' />
          </div>

          {/* Mensaje principal */}
          <div className='space-y-2'>
            <p className='text-gray-600'>Hemos enviado un enlace para restablecer tu contraseña a:</p>
            <div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
              <p className='text-sm text-blue-900 font-mono'>{sentEmail}</p>
            </div>
          </div>

          {/* Instrucciones */}
          <div className='bg-gray-50 border border-gray-200 rounded-md p-4'>
            <div className='text-left'>
              <h3 className='text-sm font-medium text-gray-900 mb-2'>Instrucciones:</h3>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>• Revisa tu bandeja de entrada</li>
                <li>• Busca también en spam/correo no deseado</li>
                <li>• El enlace expira en 1 hora</li>
                <li>• Haz clic en el enlace para crear una nueva contraseña</li>
              </ul>
            </div>
          </div>

          {/* Email de soporte */}
          <div className='text-xs text-gray-500'>
            ¿Problemas con la recuperación?{' '}
            <a href='mailto:soporte@tuapp.com' className='text-blue-600 hover:text-blue-500'>
              Contacta soporte
            </a>
          </div>
        </div>
      </AuthForm>
    )
  }

  return (
    <AuthForm
      title='Recuperar Contraseña'
      subtitle='Te enviaremos un enlace para restablecer tu contraseña'
      footer={
        <div className='space-y-2'>
          <p className='text-sm text-gray-600'>
            ¿Recordaste tu contraseña?{' '}
            <Link href='/login' className='font-medium text-blue-600 hover:text-blue-500 transition-colors'>
              Iniciar sesión
            </Link>
          </p>
          <Link
            href='/register'
            className='inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors'
          >
            ¿No tienes cuenta? Regístrate aquí
          </Link>
        </div>
      }
    >
      <form className='space-y-6' onSubmit={handleSubmit(onSubmit)}>
        {/* Información */}
        <div className='bg-blue-50 border border-blue-200 rounded-md p-4'>
          <div className='flex'>
            <Mail className='h-5 w-5 text-blue-500 mt-0.5 mr-2' />
            <div className='text-sm text-blue-800'>
              <p className='font-medium'>¿Olvidaste tu contraseña?</p>
              <p className='mt-1'>Ingresa tu email y te enviaremos un enlace seguro para crear una nueva contraseña.</p>
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
            Email registrado
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

        {/* Botón */}
        <button
          type='submit'
          disabled={isLoading}
          className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          {isLoading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Enviando enlace...
            </>
          ) : (
            <>
              <Mail className='mr-2 h-4 w-4' />
              Enviar Enlace de Recuperación
            </>
          )}
        </button>

        {/* Seguridad */}
        <div className='text-xs text-gray-500 text-center'>
          <p>🔒 Este proceso es seguro. Solo tú podrás acceder al enlace enviado a tu email.</p>
        </div>
      </form>
    </AuthForm>
  )
}

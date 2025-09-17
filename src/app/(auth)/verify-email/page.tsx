'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react'

import { AuthForm } from '@/components/auth/auth-form'
import { AuthService } from '@/lib/auth/auth-service'

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [email, setEmail] = useState('')
  const searchParams = useSearchParams()
  const emailFromParams = searchParams.get('email')

  useEffect(() => {
    if (emailFromParams) {
      setEmail(decodeURIComponent(emailFromParams))
    }
  }, [emailFromParams])

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Por favor ingresa tu email')
      return
    }

    setIsResending(true)
    try {
      await AuthService.resendVerification(email)
      toast.success('Email de verificación reenviado')
    } catch (error) {
      toast.error('Error al enviar el email de verificación')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <AuthForm
      title='Verifica tu Email'
      subtitle='Te hemos enviado un email de verificación'
      footer={
        <div className='space-y-2'>
          <p className='text-sm text-gray-600'>
            ¿Ya verificaste tu email?{' '}
            <Link href='/login' className='font-medium text-blue-600 hover:text-blue-500 transition-colors'>
              Inicia sesión
            </Link>
          </p>
          <Link
            href='/register'
            className='inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors'
          >
            <ArrowLeft className='h-4 w-4 mr-1' />
            Volver al registro
          </Link>
        </div>
      }
    >
      <div className='text-center space-y-6'>
        {/* Icono principal */}
        <div className='mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center'>
          <Mail className='h-8 w-8 text-blue-600' />
        </div>

        {/* Mensaje principal */}
        <div className='space-y-2'>
          <p className='text-gray-600'>Hemos enviado un enlace de verificación a tu email.</p>
          <p className='text-gray-600'>Haz clic en el enlace para activar tu cuenta.</p>
          {email && (
            <div className='bg-blue-50 border border-blue-200 rounded-md p-3 mt-4'>
              <p className='text-sm text-blue-800'>
                <strong>Email enviado a:</strong>
              </p>
              <p className='text-sm text-blue-900 font-mono'>{email}</p>
            </div>
          )}
        </div>

        {/* Formulario para reenviar */}
        <div className='space-y-4'>
          <div className='text-left'>
            <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
              ¿No recibiste el email? Reenviar a:
            </label>
            <input
              id='email'
              type='email'
              placeholder='tu@email.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          <button
            onClick={handleResendVerification}
            disabled={isResending || !email}
            className='w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {isResending ? (
              <>
                <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                Reenviando...
              </>
            ) : (
              <>
                <Mail className='mr-2 h-4 w-4' />
                Reenviar Email
              </>
            )}
          </button>
        </div>

        {/* Información adicional */}
        <div className='bg-gray-50 border border-gray-200 rounded-md p-4'>
          <div className='flex items-start'>
            <CheckCircle className='h-5 w-5 text-green-500 mt-0.5 mr-2' />
            <div className='text-left'>
              <h3 className='text-sm font-medium text-gray-900'>Consejos:</h3>
              <ul className='mt-2 text-sm text-gray-600 space-y-1'>
                <li>• Revisa tu carpeta de spam</li>
                <li>• El enlace expira en 24 horas</li>
                <li>• Solo necesitas hacer clic una vez</li>
                <li>• Después podrás iniciar sesión normalmente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Email de soporte */}
        <div className='text-xs text-gray-500'>
          ¿Problemas con la verificación?{' '}
          <a href='mailto:soporte@tuapp.com' className='text-blue-600 hover:text-blue-500'>
            Contacta soporte
          </a>
        </div>
      </div>
    </AuthForm>
  )
}

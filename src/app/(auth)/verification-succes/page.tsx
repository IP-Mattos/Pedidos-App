'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Home } from 'lucide-react'

import { AuthForm } from '@/components/auth/auth-form'
import { useAuth } from '@/hooks/use-auth'

export default function VerificationSuccessPage() {
  const [countdown, setCountdown] = useState(5)
  const router = useRouter()
  const { user, profile } = useAuth()

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <AuthForm title='¡Email Verificado!' subtitle='Tu cuenta ha sido activada exitosamente'>
      <div className='text-center space-y-6'>
        {/* Icono de éxito */}
        <div className='mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
          <CheckCircle className='h-8 w-8 text-green-600' />
        </div>

        {/* Mensaje de éxito */}
        <div className='space-y-2'>
          <p className='text-green-600 font-medium'>¡Perfecto! Tu email ha sido verificado.</p>
          <p className='text-gray-600'>
            Tu cuenta está ahora completamente activada y puedes usar todas las funciones.
          </p>
        </div>

        {/* Información del usuario */}
        {user && (
          <div className='bg-green-50 border border-green-200 rounded-md p-4'>
            <h3 className='text-sm font-medium text-green-800 mb-2'>Información de tu cuenta:</h3>
            <div className='text-sm text-green-700 space-y-1'>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              {profile && (
                <p>
                  <strong>Nombre:</strong> {profile.full_name}
                </p>
              )}
              <p>
                <strong>Rol:</strong> {profile?.role === 'admin' ? 'Administrador' : 'Trabajador'}
              </p>
            </div>
          </div>
        )}

        {/* Redirección automática */}
        <div className='bg-blue-50 border border-blue-200 rounded-md p-4'>
          <p className='text-sm text-blue-800'>
            Serás redirigido automáticamente en <span className='font-bold text-blue-900'>{countdown}</span> segundos...
          </p>
        </div>

        {/* Botones de acción */}
        <div className='space-y-3'>
          <Link href='/'>
            <button className='w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors'>
              <Home className='mr-2 h-4 w-4' />
              Ir al Dashboard
            </button>
          </Link>

          <Link href='/login'>
            <button className='w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'>
              <ArrowRight className='mr-2 h-4 w-4' />
              Ir al Login
            </button>
          </Link>
        </div>

        {/* Siguiente pasos */}
        <div className='text-left'>
          <h3 className='text-sm font-medium text-gray-900 mb-2'>Próximos pasos:</h3>
          <ul className='text-sm text-gray-600 space-y-1'>
            <li>✅ Tu email está verificado</li>
            <li>✅ Tu cuenta está activa</li>
            <li>✅ Puedes iniciar sesión cuando quieras</li>
            <li>✅ Tienes acceso completo a la aplicación</li>
          </ul>
        </div>
      </div>
    </AuthForm>
  )
}

'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

import { AuthForm } from '@/components/auth/auth-form'

// Componente interno que usa useSearchParams
function AuthCodeErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'exchange_failed':
        return 'No se pudo procesar el enlace de verificación. Puede que haya expirado.'
      case 'no_code':
        return 'El enlace de verificación es inválido o está incompleto.'
      case 'access_denied':
        return 'Acceso denegado. El enlace puede haber sido usado ya.'
      default:
        return error || 'El enlace de verificación ha expirado o es inválido.'
    }
  }

  return (
    <AuthForm title='Error de Verificación' subtitle='Hubo un problema al verificar tu cuenta'>
      <div className='text-center space-y-6'>
        {/* Icono de error */}
        <div className='mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center'>
          <AlertTriangle className='h-8 w-8 text-red-600' />
        </div>

        {/* Mensaje de error */}
        <div className='space-y-2'>
          <p className='text-red-600 font-medium'>No se pudo verificar tu cuenta</p>
          <p className='text-gray-600'>{getErrorMessage(error)}</p>
        </div>

        {/* Información del error (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className='bg-gray-50 border border-gray-200 rounded-md p-3'>
            <p className='text-xs text-gray-500'>
              <strong>Error técnico:</strong> {error}
            </p>
          </div>
        )}

        {/* Soluciones */}
        <div className='bg-yellow-50 border border-yellow-200 rounded-md p-4'>
          <h3 className='text-sm font-medium text-yellow-800 mb-2'>¿Qué puedes hacer?</h3>
          <ul className='text-sm text-yellow-700 space-y-1 text-left'>
            <li>• Solicita un nuevo enlace de verificación</li>
            <li>• Revisa que el enlace esté completo</li>
            <li>• Asegúrate de usar el enlace más reciente</li>
            <li>• Intenta desde el mismo dispositivo/navegador</li>
          </ul>
        </div>

        {/* Botones de acción */}
        <div className='space-y-3'>
          <Link href='/verify-email'>
            <button className='w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Solicitar Nuevo Enlace
            </button>
          </Link>

          <Link href='/login'>
            <button className='w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'>
              Intentar Iniciar Sesión
            </button>
          </Link>

          <Link href='/register'>
            <button className='w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Volver al Registro
            </button>
          </Link>
        </div>
      </div>
    </AuthForm>
  )
}

// Componente principal con Suspense
export default function AuthCodeErrorPage() {
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
      <AuthCodeErrorContent />
    </Suspense>
  )
}

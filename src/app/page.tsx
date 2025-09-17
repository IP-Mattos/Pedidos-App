'use client'

import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { NoSSR } from '@/components/ui/no-ssr'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from 'next/link'
import { useEffect, useState } from 'react'

function UnauthenticatedView() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full text-center space-y-8'>
        <div>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>Orders App</h1>
          <p className='text-gray-600 mb-8'>Sistema de pedidos en tiempo real</p>
        </div>

        <div className='space-y-4'>
          <Link href='/login'>
            <button className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors'>
              Iniciar Sesión
            </button>
          </Link>

          <Link href='/register'>
            <button className='w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors'>
              Crear Cuenta
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function AuthenticatedView({ user, profile, signOut }: any) {
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        <div className='px-4 py-6 sm:px-0'>
          <div className='border-4 border-dashed border-gray-200 rounded-lg p-8'>
            <div className='text-center'>
              <h1 className='text-3xl font-bold text-gray-900 mb-4'>
                ¡Bienvenido, {profile?.full_name || user.email}!
              </h1>

              <div className='bg-white shadow rounded-lg p-6 mb-6'>
                <h2 className='text-lg font-medium text-gray-900 mb-4'>Información del Usuario</h2>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  <div className='text-left'>
                    <dt className='text-sm font-medium text-gray-500'>Email</dt>
                    <dd className='mt-1 text-sm text-gray-900'>{user.email}</dd>
                  </div>
                  {profile ? (
                    <>
                      <div className='text-left'>
                        <dt className='text-sm font-medium text-gray-500'>Nombre</dt>
                        <dd className='mt-1 text-sm text-gray-900'>{profile.full_name}</dd>
                      </div>
                      <div className='text-left'>
                        <dt className='text-sm font-medium text-gray-500'>Rol</dt>
                        <dd className='mt-1 text-sm text-gray-900'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              profile.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {profile.role === 'admin' ? 'Administrador' : 'Trabajador'}
                          </span>
                        </dd>
                      </div>
                    </>
                  ) : (
                    <div className='text-left col-span-2'>
                      <div className='bg-yellow-50 border border-yellow-200 rounded p-3'>
                        <p className='text-sm text-yellow-800'>
                          ⚠️ Perfil no encontrado. La funcionalidad puede estar limitada.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className='text-left'>
                    <dt className='text-sm font-medium text-gray-500'>Email Verificado</dt>
                    <dd className='mt-1 text-sm text-gray-900'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.email_confirmed_at ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.email_confirmed_at ? 'Verificado' : 'Pendiente'}
                      </span>
                    </dd>
                  </div>
                </div>
              </div>

              <button
                onClick={signOut}
                className='bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors'
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user, profile, loading, signOut, isHydrated } = useAuth()
  const [showTimeout, setShowTimeout] = useState(false)

  // Mostrar advertencia si tarda mucho
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setShowTimeout(true)
      }
    }, 10000) // 10 segundos

    return () => clearTimeout(timer)
  }, [loading])

  // Mostrar loading hasta que esté hidratado y se resuelva la auth
  if (!isHydrated || loading) {
    return (
      <LoadingSpinner
        message={showTimeout ? 'Conectando con la base de datos...' : 'Cargando aplicación...'}
        timeout={showTimeout}
      />
    )
  }

  return (
    <NoSSR fallback={<LoadingSpinner />}>
      {user ? <AuthenticatedView user={user} profile={profile} signOut={signOut} /> : <UnauthenticatedView />}
    </NoSSR>
  )
}

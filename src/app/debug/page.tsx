'use client'

import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function DebugPage() {
  const { user, profile, loading } = useAuth()
  const [testResult, setTestResult] = useState<string>('')
  const supabase = createClient()

  const testProfileAccess = async () => {
    try {
      setTestResult('Probando acceso a perfiles...')

      const { data, error } = await supabase.from('profiles').select('*').limit(5)

      if (error) {
        setTestResult(`Error: ${error.message} (Code: ${error.code})`)
      } else {
        setTestResult(`Éxito: Encontrados ${data.length} perfiles`)
      }
    } catch (error) {
      setTestResult(`Error inesperado: ${error}`)
    }
  }

  if (loading) return <div className='p-8'>Cargando...</div>

  return (
    <div className='p-8 bg-gray-100 min-h-screen'>
      <h1 className='text-2xl font-bold mb-4'>Debug Info</h1>

      <button onClick={testProfileAccess} className='mb-4 bg-blue-500 text-white px-4 py-2 rounded'>
        Probar Acceso a Perfiles
      </button>

      {testResult && (
        <div className='bg-white p-4 rounded mb-4'>
          <strong>Resultado:</strong> {testResult}
        </div>
      )}

      <div className='bg-white p-4 rounded mb-4'>
        <h2 className='font-bold'>Usuario (Supabase Auth):</h2>
        <pre className='text-sm bg-gray-100 p-2 rounded mt-2'>{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className='bg-white p-4 rounded'>
        <h2 className='font-bold'>Perfil (Tabla profiles):</h2>
        <pre className='text-sm bg-gray-100 p-2 rounded mt-2'>{JSON.stringify(profile, null, 2)}</pre>
      </div>
    </div>
  )
}

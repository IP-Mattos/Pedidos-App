interface LoadingSpinnerProps {
  message?: string
  timeout?: boolean
}

export function LoadingSpinner({ message = 'Cargando...', timeout = false }: LoadingSpinnerProps) {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center space-y-4'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
        <p className='text-gray-600'>{message}</p>
        {timeout && (
          <div className='text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded p-3 max-w-md'>
            ⚠️ La carga está tomando más tiempo del esperado. Puede haber un problema de conexión.
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { ReactNode } from 'react'
import { Shield } from 'lucide-react'

interface AuthFormProps {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthForm({ title, subtitle, children, footer }: AuthFormProps) {
  return (
    <div>
      {/* Header */}
      <div className='text-center'>
        <div className='mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100'>
          <Shield className='h-6 w-6 text-blue-600' />
        </div>
        <h2 className='mt-6 text-3xl font-bold tracking-tight text-gray-900'>{title}</h2>
        {subtitle && <p className='mt-2 text-sm text-gray-600'>{subtitle}</p>}
      </div>

      {/* Form Container */}
      <div className='mt-8'>
        <div className='bg-white py-8 px-4 shadow-xl ring-1 ring-gray-900/5 sm:rounded-xl sm:px-10'>{children}</div>

        {/* Footer */}
        {footer && <div className='mt-6 text-center'>{footer}</div>}
      </div>
    </div>
  )
}

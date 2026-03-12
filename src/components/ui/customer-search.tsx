'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, UserPlus } from 'lucide-react'
import { CustomerService } from '@/lib/services/customer-services'
import type { Customer } from '@/types/database'

interface CustomerSearchProps {
  value: string
  onChange: (name: string) => void
  onSelect: (customer: Customer) => void
}

export function CustomerSearch({ value, onChange, onSelect }: CustomerSearchProps) {
  const [results, setResults] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (value.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      const customers = await CustomerService.search(value)
      setResults(customers)
      setOpen(true)
      setLoading(false)
    }, 250)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className='relative'>
      <div className='relative'>
        <Search className='absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none' />
        <input
          type='text'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          placeholder='Nombre del cliente'
          autoComplete='off'
        />
        {loading && (
          <div className='absolute right-3 top-2.5 h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin' />
        )}
      </div>

      {open && (
        <div className='absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-56 overflow-y-auto'>
          {results.length === 0 ? (
            <div className='flex items-center gap-2 px-4 py-3 text-sm text-gray-500'>
              <UserPlus className='h-4 w-4' />
              Se creará un cliente nuevo con este nombre
            </div>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type='button'
                onClick={() => {
                  onChange(c.nombre)
                  onSelect(c)
                  setOpen(false)
                }}
                className='w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-100 last:border-0 transition-colors'
              >
                <p className='text-sm font-medium text-gray-900'>{c.nombre}</p>
                {(c.phone || c.address) && (
                  <p className='text-xs text-gray-500 mt-0.5 truncate'>
                    {[c.phone, c.address].filter(Boolean).join(' · ')}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

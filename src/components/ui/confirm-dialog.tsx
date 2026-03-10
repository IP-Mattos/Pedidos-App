'use client'

import { AlertCircle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  confirmClass?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  confirmClass = 'px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
      <div className='bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4'>
        <div className='flex items-center gap-3 mb-4'>
          <AlertCircle className='h-6 w-6 text-red-500 flex-shrink-0' />
          <h3 className='text-base font-semibold text-gray-900'>{title}</h3>
        </div>
        <p className='text-sm text-gray-500 mb-6'>{message}</p>
        <div className='flex justify-end gap-3'>
          <button
            onClick={onCancel}
            className='px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
          >
            No, volver
          </button>
          <button onClick={onConfirm} className={confirmClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

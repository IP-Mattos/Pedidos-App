import { LabelHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// Cambiado de 'interface' a 'type' para evitar el error de interface vacía
export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>

const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-sm font-medium text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      className
    )}
    {...props}
  />
))

Label.displayName = 'Label'

export { Label }

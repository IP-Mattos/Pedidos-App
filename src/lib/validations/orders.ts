import { z } from 'zod'

export const productSchema = z.object({
  producto: z.string().min(1, 'El producto es requerido'),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  precio: z.number().min(0.01, 'El precio debe ser mayor a 0')
})

export const createOrderSchema = z.object({
  nombre_cliente: z.string().min(2, 'El nombre del cliente es requerido'),
  customer_phone: z.string().optional(), // ✅ Cambiar nombre del campo
  customer_address: z.string().optional(), // ✅ Cambiar nombre del campo
  fecha_entrega: z.string().min(1, 'La fecha de entrega es requerida'),
  metodo_pago: z.enum(['efectivo', 'credito', 'dolares', 'cheque', 'transferencia']),
  esta_pagado: z.boolean(),
  productos: z.array(productSchema).min(1, 'Debe agregar al menos un producto'),
  notas: z.string().optional()
})

export type ProductFormData = z.infer<typeof productSchema>
export type CreateOrderFormData = z.infer<typeof createOrderSchema>

// Tipos de la base de datos
export type UserRole = 'admin' | 'worker'
export type PaymentMethod = 'efectivo' | 'credito' | 'dolares' | 'cheque' | 'transferencia'
export type OrderStatus = 'pendiente' | 'en_proceso' | 'completado' | 'entregado' | 'cancelado'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Product {
  producto: string
  cantidad: number
  precio: number
}

export interface Order {
  id: string
  nombre_cliente: string
  lista_productos: Product[]
  fecha_entrega: string
  esta_pagado: boolean
  metodo_pago: PaymentMethod
  monto_total: number
  status: OrderStatus
  notas?: string
  created_by: string
  created_at: string
  updated_at: string
  creator?: Profile
}

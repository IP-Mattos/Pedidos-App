import { createClient } from '@/lib/supabase/client'
import type { CreateOrderFormData } from '@/lib/validations/orders'

export class OrdersService {
  // ========== MÉTODOS ORIGINALES ==========

  static async createOrder(orderData: CreateOrderFormData) {
    const supabase = createClient()

    // Calcular el total
    const total = orderData.productos.reduce((sum, item) => sum + item.precio * item.cantidad, 0)

    // Obtener usuario actual
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    // Crear el pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        nombre_cliente: orderData.nombre_cliente,
        customer_phone: orderData.customer_phone || null,
        customer_address: orderData.customer_address || null,
        lista_productos: JSON.stringify(orderData.productos),
        fecha_entrega: orderData.fecha_entrega,
        esta_pagado: orderData.esta_pagado,
        metodo_pago: orderData.metodo_pago,
        monto_total: total,
        status: 'pendiente',
        notas: orderData.notas || null,
        created_by: user.id
      })
      .select()
      .single()

    if (orderError) {
      throw new Error(orderError.message)
    }

    return order
  }

  static async getOrders() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        creator:profiles!orders_created_by_fkey (
          full_name,
          email
        ),
        assignee:profiles!orders_assigned_to_fkey (
          full_name,
          email
        )
      `
      )
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data?.map((order) => ({
      ...order,
      lista_productos:
        typeof order.lista_productos === 'string' ? JSON.parse(order.lista_productos) : order.lista_productos
    }))
  }

  static async updateOrderStatus(orderId: string, status: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  // ========== MÉTODOS NUEVOS PARA WORKERS ==========

  static async assignOrderToWorker(orderId: string, workerId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .update({
        assigned_to: workerId,
        assigned_at: new Date().toISOString(),
        status: 'en_proceso'
      })
      .eq('id', orderId)
      .eq('status', 'pendiente') // Solo se puede asignar si está pendiente
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('El pedido ya no está disponible o ya fue asignado')
    }

    return data
  }

  static async addProgressUpdate(orderId: string, status: string, notes?: string) {
    const supabase = createClient()

    // Obtener usuario actual
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    // Verificar que el pedido esté asignado al usuario actual
    const { data: order } = await supabase.from('orders').select('assigned_to').eq('id', orderId).single()

    if (!order || order.assigned_to !== user.id) {
      throw new Error('No tienes permisos para actualizar este pedido')
    }

    // Agregar entrada al log de progreso
    const { error: progressError } = await supabase.from('order_progress').insert({
      order_id: orderId,
      worker_id: user.id,
      status,
      notes
    })

    if (progressError) {
      throw new Error(progressError.message)
    }

    // Actualizar estado del pedido
    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  static async getOrderProgress(orderId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('order_progress')
      .select(
        `
        *,
        worker:profiles!order_progress_worker_id_fkey (
          full_name,
          email
        )
      `
      )
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  static async getOrdersWithAssignments() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        creator:profiles!orders_created_by_fkey (
          full_name,
          email
        ),
        assignee:profiles!orders_assigned_to_fkey (
          full_name,
          email
        )
      `
      )
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data?.map((order) => ({
      ...order,
      lista_productos:
        typeof order.lista_productos === 'string' ? JSON.parse(order.lista_productos) : order.lista_productos
    }))
  }

  // ========== MÉTODOS PARA WORKERS ESPECÍFICOS ==========

  static async getAvailableOrders() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        creator:profiles!orders_created_by_fkey (
          full_name,
          email
        )
      `
      )
      .eq('status', 'pendiente')
      .is('assigned_to', null)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data?.map((order) => ({
      ...order,
      lista_productos:
        typeof order.lista_productos === 'string' ? JSON.parse(order.lista_productos) : order.lista_productos
    }))
  }

  static async getMyAssignedOrders(workerId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        creator:profiles!orders_created_by_fkey (
          full_name,
          email
        )
      `
      )
      .eq('assigned_to', workerId)
      .neq('status', 'cancelado')
      .order('assigned_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data?.map((order) => ({
      ...order,
      lista_productos:
        typeof order.lista_productos === 'string' ? JSON.parse(order.lista_productos) : order.lista_productos
    }))
  }

  static async releaseOrder(orderId: string) {
    const supabase = createClient()

    // Obtener usuario actual
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        assigned_to: null,
        assigned_at: null,
        status: 'pendiente'
      })
      .eq('id', orderId)
      .eq('assigned_to', user.id) // Solo el worker asignado puede liberarlo
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('No tienes permisos para liberar este pedido')
    }

    return data
  }
}

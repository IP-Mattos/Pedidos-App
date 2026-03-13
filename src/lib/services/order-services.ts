import { createClient } from '@/lib/supabase/client'
import type { CreateOrderFormData } from '@/lib/validations/orders'
import { ProductProgressService } from '@/lib/services/product-progress-services'
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
    const insertPayload: Record<string, unknown> = {
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
    }

    // Columnas opcionales (requieren migración SQL previa)
    if (orderData.requiere_boleta !== undefined) insertPayload.requiere_boleta = orderData.requiere_boleta
    if (orderData.rut_cliente) insertPayload.rut_cliente = orderData.rut_cliente
    if (orderData.es_ingreso !== undefined) insertPayload.es_ingreso = orderData.es_ingreso

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(insertPayload)
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

  static async updateOrder(
    orderId: string,
    updates: {
      nombre_cliente?: string
      customer_phone?: string | null
      customer_address?: string | null
      fecha_entrega?: string
      metodo_pago?: string
      esta_pagado?: boolean
      lista_productos?: unknown[]
      monto_total?: number
      notas?: string | null
      requiere_boleta?: boolean
      rut_cliente?: string | null
      es_ingreso?: boolean
    }
  ) {
    const supabase = createClient()

    const payload: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    if (updates.lista_productos) {
      payload.lista_productos = JSON.stringify(updates.lista_productos)
    }

    const { data, error } = await supabase.from('orders').update(payload).eq('id', orderId).select().single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  static async getOrderById(orderId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        creator:profiles!orders_created_by_fkey (
          id, full_name, email
        ),
        assignee:profiles!orders_assigned_to_fkey (
          id, full_name, email
        )
      `
      )
      .eq('id', orderId)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return {
      ...data,
      lista_productos:
        typeof data.lista_productos === 'string' ? JSON.parse(data.lista_productos) : data.lista_productos
    }
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
    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()

    if (!order) {
      throw new Error('Pedido no encontrado')
    }

    // Asignar el pedido
    const { data, error } = await supabase
      .from('orders')
      .update({
        assigned_to: workerId,
        assigned_at: new Date().toISOString(),
        status: 'en_proceso'
      })
      .eq('id', orderId)
      .eq('status', 'pendiente')
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('El pedido ya no está disponible o ya fue asignado')
    }

    // Inicializar el progreso de productos
    try {
      const productos =
        typeof order.lista_productos === 'string' ? JSON.parse(order.lista_productos) : order.lista_productos

      await ProductProgressService.initializeProductProgress(orderId, productos)
    } catch (error) {
      console.error('Error initializing product progress:', error)
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

  static async getMyCompletedOrders(workerId: string) {
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
      .in('status', ['completado', 'pagado', 'entregado'])
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data?.map((order) => ({
      ...order,
      lista_productos:
        typeof order.lista_productos === 'string' ? JSON.parse(order.lista_productos) : order.lista_productos
    }))
  }

  // Asignar pedido a un worker específico (solo admin, puede sobreescribir)
  static async adminAssignOrder(orderId: string, workerId: string | null) {
    const supabase = createClient()

    const updateData =
      workerId === null
        ? { assigned_to: null, assigned_at: null, status: 'pendiente', updated_at: new Date().toISOString() }
        : {
            assigned_to: workerId,
            assigned_at: new Date().toISOString(),
            status: 'en_proceso',
            updated_at: new Date().toISOString()
          }

    const { data, error } = await supabase.from('orders').update(updateData).eq('id', orderId).select().single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  static async getCompletedOrders() {
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
      .eq('status', 'completado')
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data?.map((order) => ({
      ...order,
      lista_productos:
        typeof order.lista_productos === 'string' ? JSON.parse(order.lista_productos) : order.lista_productos
    }))
  }

  static async deliveryUpdateStatus(orderId: string, newStatus: 'pagado' | 'entregado') {
    const supabase = createClient()

    const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single()

    if (!order || order.status !== 'completado') {
      throw new Error('Solo se pueden actualizar pedidos con estado "completado"')
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  static async getWorkerRanking(period?: 'today' | 'week' | 'month' | 'all') {
    const supabase = createClient()

    const [{ data: workers, error: wErr }, { data: orders, error: oErr }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').eq('role', 'worker'),
      supabase
        .from('orders')
        .select('id, status, assigned_to, assigned_at, updated_at')
        .not('assigned_to', 'is', null)
    ])

    if (wErr) throw new Error(wErr.message)
    if (oErr) throw new Error(oErr.message)

    const today = new Date().toISOString().split('T')[0]

    // Compute date cutoff for period filter
    let cutoffDate: string | null = null
    if (period === 'today') {
      cutoffDate = today
    } else if (period === 'week') {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      cutoffDate = d.toISOString().split('T')[0]
    } else if (period === 'month') {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      cutoffDate = d.toISOString().split('T')[0]
    }

    return (workers || [])
      .map((worker) => {
        const wo = (orders || []).filter((o) => o.assigned_to === worker.id)
        const allCompleted = wo.filter((o) => ['completado', 'pagado', 'entregado'].includes(o.status))

        // Filter completed orders by period
        const completed = cutoffDate
          ? allCompleted.filter((o) => o.updated_at && o.updated_at.split('T')[0] >= cutoffDate!)
          : allCompleted

        const inProgress = wo.filter((o) => o.status === 'en_proceso').length
        const completedToday = allCompleted.filter((o) => o.updated_at?.split('T')[0] === today).length

        const timesMs = completed
          .filter((o) => o.assigned_at && o.updated_at)
          .map((o) => new Date(o.updated_at).getTime() - new Date(o.assigned_at!).getTime())
          .filter((t) => t > 0)

        const avgTimeMs = timesMs.length > 0 ? timesMs.reduce((a, b) => a + b, 0) / timesMs.length : null
        const score = completed.length * 10000 - (avgTimeMs ? avgTimeMs / 60000 : 0)

        return {
          id: worker.id,
          full_name: worker.full_name,
          email: worker.email,
          completed: completed.length,
          inProgress,
          completedToday,
          avgTimeMs,
          score,
          total: wo.length
        }
      })
      .sort((a, b) => b.score - a.score)
  }

  static async getWorkerDetail(workerId: string) {
    const supabase = createClient()

    const [{ data: profile, error: pErr }, { data: orders, error: oErr }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, role').eq('id', workerId).single(),
      supabase
        .from('orders')
        .select('id, nombre_cliente, status, assigned_at, updated_at, monto_total, lista_productos, notas')
        .eq('assigned_to', workerId)
        .order('assigned_at', { ascending: false })
    ])

    if (pErr) throw new Error(pErr.message)
    if (oErr) throw new Error(oErr.message)

    return {
      profile,
      orders: (orders || []).map((o) => ({
        ...o,
        lista_productos:
          typeof o.lista_productos === 'string' ? JSON.parse(o.lista_productos) : o.lista_productos,
        durationMs:
          o.assigned_at && o.updated_at && ['completado', 'pagado', 'entregado'].includes(o.status)
            ? Math.max(0, new Date(o.updated_at).getTime() - new Date(o.assigned_at).getTime())
            : null
      }))
    }
  }

  static async getDeliveryHistory() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        assignee:profiles!orders_assigned_to_fkey (
          full_name,
          email
        )
      `
      )
      .in('status', ['pagado', 'entregado'])
      .order('updated_at', { ascending: false })

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

  static async bulkUpdateStatus(orderIds: string[], status: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', orderIds)
      .select()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  static async getDashboardStats() {
    const supabase = createClient()

    const today = new Date().toISOString().split('T')[0]
    const todayStart = `${today}T00:00:00.000Z`

    const [{ data: todayOrders, error: tErr }, { data: recentPending, error: rErr }] = await Promise.all([
      supabase
        .from('orders')
        .select('id, status, monto_total, assigned_to, nombre_cliente, created_at')
        .gte('created_at', todayStart),
      supabase
        .from('orders')
        .select('id, nombre_cliente, status, monto_total, created_at')
        .eq('status', 'pendiente')
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    if (tErr) throw new Error(tErr.message)
    if (rErr) throw new Error(rErr.message)

    const allToday = todayOrders || []
    const totalHoy = allToday.length
    const pendientesHoy = allToday.filter((o) => o.status === 'pendiente').length
    const ingresosDia = allToday
      .filter((o) => ['completado', 'pagado', 'entregado'].includes(o.status))
      .reduce((sum, o) => sum + (o.monto_total || 0), 0)

    // Workers activos = unique assigned_to in en_proceso today
    const workersActivosSet = new Set(
      allToday.filter((o) => o.status === 'en_proceso' && o.assigned_to).map((o) => o.assigned_to)
    )
    const workersActivos = workersActivosSet.size

    return {
      totalHoy,
      pendientesHoy,
      ingresosDia,
      workersActivos,
      recentPending: recentPending || []
    }
  }
}

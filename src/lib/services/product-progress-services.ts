import { createClient } from '@/lib/supabase/client'

export interface ProductProgress {
  id?: string
  order_id: string
  product_index: number
  producto: string
  cantidad: number
  cantidad_completada: number
  is_completed: boolean
  completed_at?: string
  completed_by?: string
  notes?: string
}

export class ProductProgressService {
  // Inicializar el progreso de productos cuando se asigna un pedido
  static async initializeProductProgress(orderId: string, products: any[]) {
    const supabase = createClient()

    const progressItems = products.map((product, index) => ({
      order_id: orderId,
      product_index: index,
      producto: product.producto,
      cantidad: product.cantidad,
      cantidad_completada: 0,
      is_completed: false
    }))

    const { error } = await supabase.from('order_product_progress').upsert(progressItems, {
      onConflict: 'order_id,product_index',
      ignoreDuplicates: true
    })

    if (error) {
      console.error('Error initializing product progress:', error)
      throw new Error(error.message)
    }
  }

  // Obtener el progreso de varios pedidos en una sola query (para el board)
  static async getProgressForOrders(orderIds: string[]): Promise<Record<string, { done: number; total: number }>> {
    if (orderIds.length === 0) return {}
    const supabase = createClient()
    const { data } = await supabase
      .from('order_product_progress')
      .select('order_id, is_completed')
      .in('order_id', orderIds)
    const result: Record<string, { done: number; total: number }> = {}
    for (const row of data ?? []) {
      if (!result[row.order_id]) result[row.order_id] = { done: 0, total: 0 }
      result[row.order_id].total++
      if (row.is_completed) result[row.order_id].done++
    }
    return result
  }

  // Obtener el progreso de productos de un pedido
  static async getOrderProductProgress(orderId: string): Promise<ProductProgress[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('order_product_progress')
      .select('*')
      .eq('order_id', orderId)
      .order('product_index', { ascending: true })

    if (error) {
      console.error('Error fetching product progress:', error)
      return []
    }

    return data || []
  }

  // Actualizar el progreso de un producto
  static async updateProductProgress(
    orderId: string,
    productIndex: number,
    updates: {
      cantidad_completada?: number
      is_completed?: boolean
      notes?: string
    }
  ) {
    const supabase = createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    if (updates.is_completed) {
      updateData.completed_at = new Date().toISOString()
      updateData.completed_by = user?.id
    }

    const { data, error } = await supabase
      .from('order_product_progress')
      .update(updateData)
      .eq('order_id', orderId)
      .eq('product_index', productIndex)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Verificar si todos los productos están completos
    await this.checkAndUpdateOrderCompletion(orderId)

    return data
  }

  // Verificar si todos los productos están completos y actualizar el estado del pedido
  static async checkAndUpdateOrderCompletion(orderId: string) {
    const supabase = createClient()

    const { data: progress } = await supabase.from('order_product_progress').select('*').eq('order_id', orderId)

    if (progress && progress.length > 0) {
      const allCompleted = progress.every((item) => item.is_completed)

      if (allCompleted) {
        // Actualizar el estado del pedido a completado
        await supabase
          .from('orders')
          .update({
            status: 'completado',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)
      }
    }
  }

  // Marcar/desmarcar un producto como completado
  static async toggleProductComplete(orderId: string, productIndex: number, isCompleted: boolean) {
    const supabase = createClient()

    // Primero obtener el producto actual
    const { data: currentProduct } = await supabase
      .from('order_product_progress')
      .select('cantidad')
      .eq('order_id', orderId)
      .eq('product_index', productIndex)
      .single()

    if (!currentProduct) {
      throw new Error('Producto no encontrado')
    }

    return this.updateProductProgress(orderId, productIndex, {
      is_completed: isCompleted,
      cantidad_completada: isCompleted ? currentProduct.cantidad : 0
    })
  }
}

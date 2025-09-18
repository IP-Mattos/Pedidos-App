'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/types/database'
import { OrdersService } from '@/lib/services/order-services'

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Cargar pedidos iniciales
    const fetchOrders = async () => {
      try {
        const data = await OrdersService.getOrdersWithAssignments()
        setOrders(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar pedidos')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('🔔 Order change detected:', payload)

          if (payload.eventType === 'INSERT') {
            const newOrder = {
              ...payload.new,
              lista_productos:
                typeof payload.new.lista_productos === 'string'
                  ? JSON.parse(payload.new.lista_productos)
                  : payload.new.lista_productos
            } as Order

            setOrders((prev) => [newOrder, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = {
              ...payload.new,
              lista_productos:
                typeof payload.new.lista_productos === 'string'
                  ? JSON.parse(payload.new.lista_productos)
                  : payload.new.lista_productos
            } as Order

            setOrders((prev) => prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)))
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((order) => order.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const refetch = async () => {
    setLoading(true)
    try {
      const data = await OrdersService.getOrdersWithAssignments()
      setOrders(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos')
    } finally {
      setLoading(false)
    }
  }

  return { orders, loading, error, refetch }
}

// Hook específico para workers
export function useWorkerOrders(workerId: string) {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchWorkerOrders = async () => {
      try {
        const [available, assigned] = await Promise.all([
          OrdersService.getAvailableOrders(),
          OrdersService.getMyAssignedOrders(workerId)
        ])

        setAvailableOrders(available || [])
        setMyOrders(assigned || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar pedidos')
      } finally {
        setLoading(false)
      }
    }

    if (workerId) {
      fetchWorkerOrders()
    }

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('worker-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          // Recargar datos cuando hay cambios
          if (workerId) {
            fetchWorkerOrders()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [workerId])

  const refetch = async () => {
    if (!workerId) return

    setLoading(true)
    try {
      const [available, assigned] = await Promise.all([
        OrdersService.getAvailableOrders(),
        OrdersService.getMyAssignedOrders(workerId)
      ])

      setAvailableOrders(available || [])
      setMyOrders(assigned || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos')
    } finally {
      setLoading(false)
    }
  }

  return { availableOrders, myOrders, loading, error, refetch }
}

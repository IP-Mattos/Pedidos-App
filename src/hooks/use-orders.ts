'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/types/database'
import { OrdersService } from '@/lib/services/order-services'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface DatabaseOrder {
  id: string
  nombre_cliente: string
  customer_phone?: string | null
  customer_address?: string | null
  lista_productos: string | Order['lista_productos']
  fecha_entrega: string
  esta_pagado: boolean
  metodo_pago: string
  monto_total: number
  status: string
  notas?: string | null
  created_by: string
  assigned_to?: string | null
  assigned_at?: string | null
  progress_notes?: string[] | null
  created_at: string
  updated_at: string
  creator?: {
    full_name: string
    email: string
  }
  assignee?: {
    full_name: string
    email: string
  }
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

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
        } as const,
        (payload: RealtimePostgresChangesPayload<DatabaseOrder>) => {
          console.log('🔔 Order change detected:', payload)

          if (payload.eventType === 'INSERT' && payload.new) {
            const newOrder: Order = {
              ...payload.new,
              lista_productos:
                typeof payload.new.lista_productos === 'string'
                  ? JSON.parse(payload.new.lista_productos)
                  : payload.new.lista_productos
            } as Order

            setOrders((prev) => [newOrder, ...prev])
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setOrders((prev) =>
              prev.map((order) => {
                if (order.id !== payload.new.id) return order
                return {
                  ...order, // preserva creator, assignee y otros joins
                  ...payload.new,
                  lista_productos:
                    typeof payload.new.lista_productos === 'string'
                      ? JSON.parse(payload.new.lista_productos)
                      : payload.new.lista_productos
                } as Order
              })
            )
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setOrders((prev) => prev.filter((order) => order.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

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
  const supabase = useMemo(() => createClient(), [])

  const fetchWorkerOrders = useCallback(async () => {
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
  }, [workerId])

  useEffect(() => {
    if (workerId) fetchWorkerOrders()

    const channel = supabase
      .channel('worker-orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' } as const,
        (payload: RealtimePostgresChangesPayload<DatabaseOrder>) => {
          if (!workerId) return

          if (payload.eventType === 'INSERT' && payload.new) {
            if (payload.new.status === 'pendiente' && !payload.new.assigned_to) {
              const newOrder = {
                ...payload.new,
                lista_productos:
                  typeof payload.new.lista_productos === 'string'
                    ? JSON.parse(payload.new.lista_productos)
                    : payload.new.lista_productos
              } as Order
              setAvailableOrders((prev) => [newOrder, ...prev])
            }
          } else {
            fetchWorkerOrders()
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [workerId, supabase, fetchWorkerOrders])

  const silentRefetch = useCallback(async () => {
    if (!workerId) return
    await fetchWorkerOrders()
  }, [workerId, fetchWorkerOrders])

  const refetch = useCallback(async () => {
    if (!workerId) return
    setLoading(true)
    await fetchWorkerOrders()
  }, [workerId, fetchWorkerOrders])

  return { availableOrders, myOrders, loading, error, refetch, silentRefetch }
}

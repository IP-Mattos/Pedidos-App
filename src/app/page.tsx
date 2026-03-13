'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { MainLayout } from '@/components/layout/main-layout'
import { NoSSR } from '@/components/ui/no-ssr'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from 'next/link'
import { Package, Clock, Plus, List, BarChart3, CheckCircle, AlertCircle, Truck, DollarSign, History, Users, Trophy } from 'lucide-react'
import { Profile, Order } from '@/types/database'
import { OrdersService } from '@/lib/services/order-services'
import { useOrders } from '@/hooks/use-orders'
import { OrderCard } from '@/components/orders/order-card'
import { WorkerOrderCard } from '@/components/orders/worker-order-card'
import { useWorkerOrders } from '@/hooks/use-orders'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  email?: string
  email_confirmed_at?: string | null
}

function UnauthenticatedView() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full text-center space-y-8'>
        <div>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>Orders App</h1>
          <p className='text-gray-600 mb-8'>Sistema de pedidos en tiempo real</p>
        </div>

        <div className='space-y-4'>
          <Link href='/login'>
            <button className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors'>
              Iniciar Sesión
            </button>
          </Link>

          <Link href='/register'>
            <button className='w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors'>
              Crear Cuenta
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

interface DashboardStats {
  totalHoy: number
  pendientesHoy: number
  ingresosDia: number
  workersActivos: number
  recentPending: { id: string; nombre_cliente: string; status: string; monto_total: number; created_at: string }[]
}

function AdminDashboard({ profile }: { profile: Profile | null }) {
  const { orders, loading, error } = useOrders()
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  const loadStats = async () => {
    try {
      const data = await OrdersService.getDashboardStats()
      setDashStats(data)
    } catch {
      // silent — fallback to orders-derived stats
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    loadStats()

    // Realtime subscription: refresh dashboard stats on any order change
    const supabase = createClient()
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const today = new Date().toISOString().split('T')[0]

  // Fallback stats from loaded orders (while dashStats is loading)
  const pendientesTotal = orders.filter((o) => o.status === 'pendiente').length
  const vencidos = orders.filter(
    (o) => o.fecha_entrega.split('T')[0] < today && !['entregado', 'cancelado'].includes(o.status)
  ).length
  // Worker ranking (top 3) from orders
  const workerMap: Record<string, { name: string; completed: number }> = {}
  orders.forEach((o) => {
    if (!o.assigned_to || !o.assignee) return
    if (!workerMap[o.assigned_to]) workerMap[o.assigned_to] = { name: o.assignee.full_name, completed: 0 }
    if (['completado', 'pagado', 'entregado'].includes(o.status)) workerMap[o.assigned_to].completed++
  })
  const topWorkers = Object.values(workerMap)
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 3)

  return (
    <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
      <div className='px-4 py-6 sm:px-0'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Dashboard Administrativo</h1>
          <p className='mt-2 text-gray-600'>Bienvenido, {profile?.full_name}. Gestiona todos los pedidos desde aquí.</p>
        </div>

        {/* Métricas del día */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <Package className='h-6 w-6 text-blue-400 flex-shrink-0' />
                <div className='ml-4 w-0 flex-1'>
                  <dt className='text-sm font-medium text-gray-500 truncate'>Pedidos hoy</dt>
                  <dd className='text-2xl font-bold text-gray-900'>
                    {loadingStats ? '…' : dashStats?.totalHoy ?? 0}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <DollarSign className='h-6 w-6 text-green-500 flex-shrink-0' />
                <div className='ml-4 w-0 flex-1'>
                  <dt className='text-sm font-medium text-gray-500 truncate'>Ingresos del día</dt>
                  <dd className='text-2xl font-bold text-green-600'>
                    {loadingStats ? '…' : `$${(dashStats?.ingresosDia ?? 0).toFixed(0)}`}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <Clock className='h-6 w-6 text-yellow-400 flex-shrink-0' />
                <div className='ml-4 w-0 flex-1'>
                  <dt className='text-sm font-medium text-gray-500 truncate'>Pendientes hoy</dt>
                  <dd className='text-2xl font-bold text-yellow-600'>
                    {loadingStats ? '…' : dashStats?.pendientesHoy ?? pendientesTotal}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='p-5'>
              <div className='flex items-center'>
                <Users className='h-6 w-6 text-violet-400 flex-shrink-0' />
                <div className='ml-4 w-0 flex-1'>
                  <dt className='text-sm font-medium text-gray-500 truncate'>Workers activos</dt>
                  <dd className='text-2xl font-bold text-violet-600'>
                    {loadingStats ? '…' : dashStats?.workersActivos ?? 0}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vencidos alert */}
        {vencidos > 0 && (
          <div className='mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800'>
            <AlertCircle className='h-5 w-5 flex-shrink-0 text-red-500' />
            <span>
              <strong>{vencidos}</strong> pedido(s) vencido(s) sin entregar.{' '}
              <Link href='/admin/orders?status=pendiente' className='underline font-medium'>
                Ver pedidos
              </Link>
            </span>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
          {/* Acciones rápidas */}
          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>Acciones Rápidas</h2>
            <div className='space-y-3'>
              <Link href='/admin/create-order'>
                <button className='w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700'>
                  <Plus className='h-4 w-4 mr-2' />
                  Crear Nuevo Pedido
                </button>
              </Link>

              <Link href='/admin/orders'>
                <button className='w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'>
                  <List className='h-4 w-4 mr-2' />
                  Ver Todos los Pedidos
                </button>
              </Link>

              <Link href='/admin/reports'>
                <button className='w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'>
                  <BarChart3 className='h-4 w-4 mr-2' />
                  Ver Reportes
                </button>
              </Link>

              <Link href='/admin/ranking'>
                <button className='w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'>
                  <Trophy className='h-4 w-4 mr-2' />
                  Ver Ranking
                </button>
              </Link>
            </div>
          </div>

          {/* Pedidos pendientes recientes */}
          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-medium text-gray-900'>Pendientes recientes</h2>
              <Link href='/admin/orders' className='text-sm text-blue-600 hover:text-blue-500'>
                Ver todos →
              </Link>
            </div>

            {loading || loadingStats ? (
              <div className='flex justify-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
              </div>
            ) : error ? (
              <div className='text-center py-8 text-red-600'>
                <AlertCircle className='mx-auto h-8 w-8 mb-2' />
                <p className='text-sm'>Error al cargar pedidos</p>
              </div>
            ) : (dashStats?.recentPending ?? []).length > 0 ? (
              <div className='space-y-3'>
                {(dashStats?.recentPending ?? []).map((order) => (
                  <Link key={order.id} href={`/admin/orders/${order.id}`} className='block border rounded-lg p-3 hover:bg-gray-50 transition-colors'>
                    <div className='flex items-center justify-between'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-gray-900 truncate'>{order.nombre_cliente}</p>
                        <p className='text-xs text-gray-400'>#{order.id.slice(-8)}</p>
                      </div>
                      <div className='text-right ml-3 flex-shrink-0'>
                        <p className='text-sm font-medium'>${order.monto_total.toFixed(2)}</p>
                        <span className='inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className='text-center py-8'>
                <CheckCircle className='mx-auto h-10 w-10 text-green-400' />
                <p className='mt-2 text-sm text-gray-500'>No hay pedidos pendientes</p>
              </div>
            )}
          </div>

          {/* Top 3 workers hoy */}
          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-medium text-gray-900'>Top workers</h2>
              <Link href='/admin/ranking' className='text-sm text-blue-600 hover:text-blue-500'>
                Ver ranking →
              </Link>
            </div>

            {loading ? (
              <div className='flex justify-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
              </div>
            ) : topWorkers.length === 0 ? (
              <div className='text-center py-8'>
                <Users className='mx-auto h-10 w-10 text-gray-300' />
                <p className='mt-2 text-sm text-gray-500'>Ningún pedido completado aún</p>
              </div>
            ) : (
              <div className='space-y-3'>
                {topWorkers.map((w, i) => (
                  <div key={w.name} className='flex items-center gap-3'>
                    <span className='text-xl'>{['🥇', '🥈', '🥉'][i]}</span>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-semibold text-gray-900 truncate'>{w.name}</p>
                      <p className='text-xs text-gray-500'>{w.completed} completados</p>
                    </div>
                    <span className='text-lg font-bold text-emerald-600'>{w.completed}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Últimos pedidos detallados */}
        {orders.length > 0 && (
          <div className='mt-4'>
            <h2 className='text-xl font-semibold text-gray-900 mb-4'>Últimos Pedidos Detallados</h2>
            <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
              {orders.slice(0, 3).map((order) => (
                <OrderCard key={order.id} order={order} isAdmin={true} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function WorkerDashboard({ profile, user }: { profile: Profile | null; user: User }) {
  const { availableOrders, myOrders, loading, error } = useWorkerOrders(user.id)
  const [showCompleted, setShowCompleted] = useState(false)

  const activeMyOrders = myOrders.filter((o) => !['completado', 'entregado', 'pagado'].includes(o.status))
  const completedMyOrders = myOrders.filter((o) => ['completado', 'entregado', 'pagado'].includes(o.status))

  const stats = {
    asignados: myOrders.length,
    en_proceso: myOrders.filter((o) => o.status === 'en_proceso').length,
    completados: myOrders.filter((o) => ['completado', 'pagado', 'entregado'].includes(o.status)).length,
    disponibles: availableOrders.length
  }

  return (
    <div className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
      <div className='px-4 py-6 sm:px-0'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Panel de Trabajador</h1>
          <p className='mt-2 text-gray-600'>Bienvenido, {profile?.full_name}. Aquí puedes ver tus pedidos asignados.</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {[
            { label: 'Mis Asignados', value: stats.asignados, icon: Package, color: 'text-blue-400' },
            { label: 'En Proceso', value: stats.en_proceso, icon: Clock, color: 'text-yellow-400' },
            { label: 'Completados', value: stats.completados, icon: CheckCircle, color: 'text-green-400' },
            { label: 'Disponibles', value: stats.disponibles, icon: Plus, color: 'text-green-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className='bg-white overflow-hidden shadow rounded-lg'>
              <div className='p-5'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0'><Icon className={`h-6 w-6 ${color}`} /></div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>{label}</dt>
                      <dd className='text-lg font-medium text-gray-900'>{value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className='flex justify-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500' />
          </div>
        ) : error ? (
          <div className='text-center py-12'>
            <AlertCircle className='mx-auto h-12 w-12 text-red-500' />
            <p className='mt-2 text-red-600'>Error al cargar pedidos: {error}</p>
          </div>
        ) : (
          <>
            <div className='mb-8'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                Pedidos Disponibles
                <span className='ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                  {availableOrders.length}
                </span>
              </h2>
              {availableOrders.length === 0 ? (
                <div className='bg-white shadow rounded-lg p-8 text-center'>
                  <Package className='mx-auto h-12 w-12 text-gray-400' />
                  <h3 className='mt-2 text-sm font-medium text-gray-900'>No hay pedidos disponibles</h3>
                  <p className='mt-1 text-sm text-gray-500'>Los nuevos pedidos aparecerán aquí cuando sean creados por los administradores.</p>
                </div>
              ) : (
                <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
                  {availableOrders.map((order) => (
                    <WorkerOrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>

            {activeMyOrders.length > 0 && (
              <div className='mb-8'>
                <h2 className='text-2xl font-bold text-gray-900 mb-4'>
                  Mis Pedidos Asignados
                  <span className='ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                    {activeMyOrders.length}
                  </span>
                </h2>
                <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
                  {activeMyOrders.map((order) => (
                    <WorkerOrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}

            {completedMyOrders.length > 0 && (
              <div className='mb-8'>
                <button
                  onClick={() => setShowCompleted((v) => !v)}
                  className='flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-3 text-sm font-medium'
                >
                  <CheckCircle className='h-4 w-4 text-green-500' />
                  Mis Pedidos Completados
                  <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                    {completedMyOrders.length}
                  </span>
                  <span className='ml-1 text-xs text-gray-400'>{showCompleted ? '▲ ocultar' : '▼ ver'}</span>
                </button>
                {showCompleted && (
                  <div className='bg-white shadow rounded-lg divide-y'>
                    {completedMyOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/worker/orders/${order.id}`}
                        className='flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors'
                      >
                        <div>
                          <p className='text-sm font-medium text-gray-900'>{order.nombre_cliente}</p>
                          <p className='text-xs text-gray-400'>#{order.id.slice(-8)}</p>
                        </div>
                        <div className='flex items-center gap-3'>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            order.status === 'entregado' ? 'bg-green-200 text-green-900' : 'bg-green-100 text-green-800'
                          }`}>
                            {order.status === 'entregado' ? 'Entregado' : order.status === 'pagado' ? 'Pagado' : 'Completado'}
                          </span>
                          <span className='text-sm text-gray-500'>${order.monto_total.toFixed(2)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className='text-center'>
              <Link href='/worker/orders'>
                <button className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700'>
                  Ver Todos los Pedidos
                  <List className='ml-2 h-5 w-5' />
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DeliveryDashboard({ profile }: { profile: Profile | null }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [history, setHistory] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const fetchData = async () => {
    try {
      const [pending, hist] = await Promise.all([
        OrdersService.getCompletedOrders(),
        OrdersService.getDeliveryHistory()
      ])
      setOrders((pending as Order[]) ?? [])
      setHistory((hist as Order[]) ?? [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Realtime subscription for delivery dashboard
    const supabase = createClient()
    const channel = supabase
      .channel('delivery-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleUpdate = async (orderId: string, status: 'pagado' | 'entregado') => {
    setUpdating(orderId)
    try {
      await OrdersService.deliveryUpdateStatus(orderId, status)
      setOrders((prev) => {
        const moved = prev.find((o) => o.id === orderId)
        if (moved) {
          setHistory((h) => [{ ...moved, status }, ...h])
        }
        return prev.filter((o) => o.id !== orderId)
      })
    } catch {
      // silent
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className='max-w-4xl mx-auto py-6 sm:px-6 lg:px-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Panel de Entrega</h1>
        <p className='mt-2 text-gray-600'>
          Bienvenido, {profile?.full_name}. Aquí están los pedidos listos para entregar.
        </p>
      </div>

      {loading ? (
        <div className='flex justify-center py-12'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500' />
        </div>
      ) : orders.length === 0 ? (
        <div className='text-center py-16 bg-white rounded-lg shadow'>
          <Truck className='mx-auto h-12 w-12 text-gray-400' />
          <h3 className='mt-2 text-sm font-medium text-gray-900'>No hay pedidos listos</h3>
          <p className='mt-1 text-sm text-gray-500'>Los pedidos completados aparecerán aquí.</p>
        </div>
      ) : (
        <div className='bg-white shadow rounded-lg divide-y'>
          {orders.map((order) => (
            <div key={order.id} className='px-5 py-4'>
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div>
                  <Link href={`/delivery/orders/${order.id}`} className='font-semibold text-gray-900 hover:text-blue-600'>
                    {order.nombre_cliente}
                  </Link>
                  <p className='text-xs text-gray-400'>#{order.id.slice(-8)}</p>
                  {order.customer_address && (
                    <p className='text-sm text-gray-500 mt-0.5'>{order.customer_address}</p>
                  )}
                  {order.customer_phone && (
                    <p className='text-sm text-gray-500'>{order.customer_phone}</p>
                  )}
                </div>
                <div className='text-right'>
                  <p className='text-sm font-medium text-gray-900'>${order.monto_total.toFixed(2)}</p>
                  <p className='text-xs text-gray-400'>{order.metodo_pago}</p>
                </div>
              </div>
              <div className='mt-3 flex gap-2'>
                <Link
                  href={`/delivery/orders/${order.id}`}
                  className='inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors'
                >
                  Ver detalle
                </Link>
                <button
                  onClick={() => handleUpdate(order.id, 'pagado')}
                  disabled={updating === order.id}
                  className='flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors'
                >
                  <DollarSign className='h-4 w-4' />
                  Pagado
                </button>
                <button
                  onClick={() => handleUpdate(order.id, 'entregado')}
                  disabled={updating === order.id}
                  className='flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors'
                >
                  <Truck className='h-4 w-4' />
                  Entregado
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historial de entregas */}
      {!loading && history.length > 0 && (
        <div className='mt-8'>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className='flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-3 text-sm font-medium'
          >
            <History className='h-4 w-4 text-gray-400' />
            Historial de entregas
            <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700'>
              {history.length}
            </span>
            <span className='ml-1 text-xs text-gray-400'>{showHistory ? '▲ ocultar' : '▼ ver'}</span>
          </button>

          {showHistory && (
            <div className='bg-white shadow rounded-lg divide-y'>
              {history.map((order) => (
                <Link
                  key={order.id}
                  href={`/delivery/orders/${order.id}`}
                  className='flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors'
                >
                  <div>
                    <p className='text-sm font-medium text-gray-900'>{order.nombre_cliente}</p>
                    <p className='text-xs text-gray-400'>#{order.id.slice(-8)}</p>
                    {order.customer_address && (
                      <p className='text-xs text-gray-500'>{order.customer_address}</p>
                    )}
                  </div>
                  <div className='flex items-center gap-3'>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      order.status === 'entregado' ? 'bg-green-200 text-green-900' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status === 'entregado' ? 'Entregado' : 'Pagado'}
                    </span>
                    <span className='text-sm text-gray-500'>${order.monto_total.toFixed(2)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AuthenticatedView({ user, profile }: AuthenticatedViewProps) {
  return (
    <MainLayout>
      {profile?.role === 'admin' ? (
        <AdminDashboard profile={profile} />
      ) : profile?.role === 'delivery' ? (
        <DeliveryDashboard profile={profile} />
      ) : (
        <WorkerDashboard profile={profile} user={user} />
      )}
    </MainLayout>
  )
}

interface AuthenticatedViewProps {
  user: User
  profile: Profile | null
}

export default function HomePage() {
  const { user, profile, isHydrated } = useAuth()

  if (!isHydrated) {
    return <LoadingSpinner message='Cargando...' />
  }

  if (!user) {
    return <UnauthenticatedView />
  }

  return (
    <NoSSR fallback={<LoadingSpinner />}>
      <AuthenticatedView user={user} profile={profile} />
    </NoSSR>
  )
}

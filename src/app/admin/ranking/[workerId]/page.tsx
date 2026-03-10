'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, CheckCircle, Clock, Package, Zap, Activity,
  TrendingUp, ChevronRight, RefreshCw
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { useAuth } from '@/hooks/use-auth'
import { OrdersService } from '@/lib/services/order-services'

type Order = {
  id: string
  nombre_cliente: string
  status: string
  assigned_at: string | null
  updated_at: string | null
  monto_total: number
  lista_productos: { nombre: string; cantidad: number; precio: number }[]
  notas: string | null
  durationMs: number | null
}

type Profile = {
  id: string
  full_name: string
  email: string
  role: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pendiente:   { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
  en_proceso:  { label: 'En proceso',  color: 'bg-blue-100 text-blue-800',     dot: 'bg-blue-400'   },
  completado:  { label: 'Completado',  color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-400' },
  pagado:      { label: 'Pagado',      color: 'bg-cyan-100 text-cyan-800',     dot: 'bg-cyan-400'   },
  entregado:   { label: 'Entregado',   color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-400' },
  cancelado:   { label: 'Cancelado',   color: 'bg-red-100 text-red-800',       dot: 'bg-red-400'    },
}

function formatDuration(ms: number | null): string {
  if (!ms || ms <= 0) return '—'
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${Math.floor(ms / 1000)}s`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function Avatar({ name, size = 'lg' }: { name: string; size?: 'lg' | 'xl' }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const palettes = [
    'from-rose-400 to-rose-600', 'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600', 'from-violet-400 to-violet-600',
    'from-amber-400 to-amber-600', 'from-pink-400 to-pink-600',
    'from-cyan-400 to-cyan-600', 'from-indigo-400 to-indigo-600',
  ]
  const color = palettes[name.charCodeAt(0) % palettes.length]
  const sz = size === 'xl' ? 'h-20 w-20 text-2xl' : 'h-14 w-14 text-lg'
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white flex-shrink-0 shadow-md`}>
      {initials}
    </div>
  )
}

function StatCard({
  icon: Icon, label, value, sub, color, bg
}: {
  icon: React.ElementType; label: string; value: string | number
  sub?: string; color: string; bg: string
}) {
  return (
    <div className={`${bg} rounded-xl p-4 shadow-sm border border-white`}>
      <div className='flex items-center gap-2 mb-1'>
        <Icon className={`h-4 w-4 ${color}`} />
        <p className='text-xs text-gray-500'>{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className='text-xs text-gray-400 mt-0.5'>{sub}</p>}
    </div>
  )
}

export default function WorkerDetailPage() {
  const { profile: authProfile } = useAuth()
  const params = useParams()
  const workerId = params.workerId as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const { profile: p, orders: o } = await OrdersService.getWorkerDetail(workerId)
      setProfile(p)
      setOrders(o as Order[])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [workerId])

  useEffect(() => { load() }, [load])

  if (authProfile?.role !== 'admin') {
    return (
      <MainLayout>
        <div className='max-w-4xl mx-auto py-12 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Acceso Denegado</h1>
        </div>
      </MainLayout>
    )
  }

  const completed = orders.filter((o) => ['completado', 'pagado', 'entregado'].includes(o.status))
  const inProgress = orders.filter((o) => o.status === 'en_proceso')
  const today = new Date().toISOString().split('T')[0]
  const completedToday = completed.filter((o) => o.updated_at?.split('T')[0] === today)
  const timesMs = completed.filter((o) => o.durationMs && o.durationMs > 0).map((o) => o.durationMs!)
  const avgTimeMs = timesMs.length > 0 ? timesMs.reduce((a, b) => a + b, 0) / timesMs.length : null
  const fastestMs = timesMs.length > 0 ? Math.min(...timesMs) : null

  return (
    <MainLayout>
      <div className='max-w-5xl mx-auto py-6 px-4 sm:px-6'>

        {/* Back */}
        <Link
          href='/admin/ranking'
          className='inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors'
        >
          <ArrowLeft className='h-4 w-4' />
          Volver al ranking
        </Link>

        {loading ? (
          <div className='flex justify-center py-32'>
            <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600' />
          </div>
        ) : !profile ? (
          <div className='text-center py-24 text-gray-500'>Trabajador no encontrado.</div>
        ) : (
          <>
            {/* Header card */}
            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6'>
              <div className='flex items-center justify-between flex-wrap gap-4'>
                <div className='flex items-center gap-4'>
                  <Avatar name={profile.full_name} size='xl' />
                  <div>
                    <h1 className='text-2xl font-bold text-gray-900'>{profile.full_name}</h1>
                    <p className='text-sm text-gray-400'>{profile.email}</p>
                    <span className='mt-1 inline-block text-xs font-medium bg-blue-100 text-blue-700 rounded-full px-2.5 py-0.5'>
                      Trabajador
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => load(true)}
                  disabled={refreshing}
                  className='inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 bg-white shadow-sm transition-colors'
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6'>
              <StatCard icon={CheckCircle} label='Completados' value={completed.length} color='text-emerald-600' bg='bg-emerald-50' />
              <StatCard icon={Zap} label='Completados hoy' value={completedToday.length} color='text-amber-600' bg='bg-amber-50' />
              <StatCard icon={Activity} label='En proceso' value={inProgress.length} color='text-blue-600' bg='bg-blue-50' />
              <StatCard
                icon={Clock} label='Tiempo promedio' value={formatDuration(avgTimeMs)}
                sub={fastestMs ? `Mejor: ${formatDuration(fastestMs)}` : undefined}
                color='text-violet-600' bg='bg-violet-50'
              />
            </div>

            {/* Orders list */}
            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
              <div className='px-6 py-4 border-b border-gray-100 flex items-center gap-2'>
                <Package className='h-4 w-4 text-gray-400' />
                <h2 className='text-sm font-semibold text-gray-700'>
                  Historial de pedidos
                  <span className='ml-2 text-gray-400 font-normal'>({orders.length})</span>
                </h2>
              </div>

              {orders.length === 0 ? (
                <div className='text-center py-16'>
                  <Package className='mx-auto h-10 w-10 text-gray-200' />
                  <p className='mt-3 text-gray-400 text-sm'>Sin pedidos asignados aún.</p>
                </div>
              ) : (
                <div className='divide-y divide-gray-50'>
                  {orders.map((order) => {
                    const st = STATUS_CONFIG[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' }
                    const isDone = ['completado', 'pagado', 'entregado'].includes(order.status)
                    return (
                      <Link
                        key={order.id}
                        href={`/admin/orders/${order.id}`}
                        className='flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group'
                      >
                        {/* Status dot */}
                        <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${st.dot}`} />

                        {/* Main info */}
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center gap-2 flex-wrap'>
                            <p className='text-sm font-semibold text-gray-900 truncate'>{order.nombre_cliente}</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                              {st.label}
                            </span>
                          </div>
                          <p className='text-xs text-gray-400 mt-0.5'>
                            {order.lista_productos?.length ?? 0} producto{order.lista_productos?.length !== 1 ? 's' : ''}
                            {' · '}
                            ${order.monto_total?.toLocaleString('es-AR')}
                          </p>
                        </div>

                        {/* Timing */}
                        <div className='hidden sm:flex flex-col items-end flex-shrink-0 gap-0.5'>
                          <div className='flex items-center gap-1.5 text-xs text-gray-400'>
                            <TrendingUp className='h-3 w-3' />
                            <span>Asignado: {formatDate(order.assigned_at)}</span>
                          </div>
                          {isDone && (
                            <div className='flex items-center gap-1.5 text-xs text-gray-400'>
                              <CheckCircle className='h-3 w-3 text-emerald-400' />
                              <span>Terminado: {formatDate(order.updated_at)}</span>
                            </div>
                          )}
                          {isDone && order.durationMs && (
                            <div className='flex items-center gap-1 mt-0.5'>
                              <Clock className='h-3 w-3 text-violet-400' />
                              <span className='text-xs font-semibold text-violet-600'>
                                {formatDuration(order.durationMs)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Mobile duration */}
                        <div className='sm:hidden text-right flex-shrink-0'>
                          {isDone && order.durationMs ? (
                            <p className='text-xs font-semibold text-violet-600'>{formatDuration(order.durationMs)}</p>
                          ) : (
                            <p className='text-xs text-gray-300'>—</p>
                          )}
                        </div>

                        <ChevronRight className='h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0' />
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}

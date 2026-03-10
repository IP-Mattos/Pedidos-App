'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { BarChart3, TrendingUp, Package, Users, DollarSign, AlertCircle, Check, Clock } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useOrders } from '@/hooks/use-orders'
import { useAuth } from '@/hooks/use-auth'
import { Order } from '@/types/database'

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className='flex items-center gap-3'>
      <div className='flex-1 bg-gray-100 rounded-full h-3 overflow-hidden'>
        <div className={`h-3 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className='text-sm font-medium text-gray-700 w-8 text-right'>{value}</span>
    </div>
  )
}

export default function AdminReportsPage() {
  const { orders, loading } = useOrders()
  const { profile } = useAuth()

  const today = new Date().toISOString().split('T')[0]

  const stats = useMemo(() => {
    const total = orders.length
    const completados = orders.filter((o) => ['completado', 'entregado'].includes(o.status)).length
    const cancelados = orders.filter((o) => o.status === 'cancelado').length
    const pendientes = orders.filter((o) => o.status === 'pendiente').length
    const enProceso = orders.filter((o) => o.status === 'en_proceso').length
    const vencidos = orders.filter(
      (o) => o.fecha_entrega.split('T')[0] < today && !['entregado', 'cancelado'].includes(o.status)
    ).length
    const pagados = orders.filter((o) => o.esta_pagado).length
    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelado')
      .reduce((sum, o) => sum + o.monto_total, 0)

    const completionRate = total > 0 ? Math.round((completados / total) * 100) : 0

    return { total, completados, cancelados, pendientes, enProceso, vencidos, pagados, totalRevenue, completionRate }
  }, [orders, today])

  // Pedidos por mes (últimos 6 meses)
  const byMonth = useMemo(() => {
    const months: Record<string, { label: string; total: number; completados: number }> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('es-UY', { month: 'short', year: '2-digit' })
      months[key] = { label, total: 0, completados: 0 }
    }
    orders.forEach((o) => {
      const key = o.created_at.slice(0, 7)
      if (months[key]) {
        months[key].total++
        if (['completado', 'entregado'].includes(o.status)) months[key].completados++
      }
    })
    return Object.values(months)
  }, [orders])

  const maxMonth = Math.max(...byMonth.map((m) => m.total), 1)

  // Workers ranking
  const workerRanking = useMemo(() => {
    const map: Record<string, { name: string; total: number; completados: number }> = {}
    orders.forEach((o) => {
      if (!o.assigned_to || !o.assignee) return
      if (!map[o.assigned_to]) {
        map[o.assigned_to] = { name: o.assignee.full_name, total: 0, completados: 0 }
      }
      map[o.assigned_to].total++
      if (['completado', 'entregado'].includes(o.status)) map[o.assigned_to].completados++
    })
    return Object.values(map).sort((a, b) => b.completados - a.completados)
  }, [orders])

  const maxWorker = Math.max(...workerRanking.map((w) => w.completados), 1)

  // Métodos de pago
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    orders.filter((o) => o.status !== 'cancelado').forEach((o) => {
      map[o.metodo_pago] = (map[o.metodo_pago] ?? 0) + 1
    })
    return Object.entries(map)
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count)
  }, [orders])

  const maxPayment = Math.max(...paymentBreakdown.map((p) => p.count), 1)

  if (profile?.role !== 'admin') {
    return (
      <MainLayout>
        <div className='max-w-6xl mx-auto py-6 px-4 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Acceso Denegado</h1>
        </div>
      </MainLayout>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner message='Cargando reportes...' />
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className='max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Reportes</h1>
          <p className='mt-2 text-gray-600'>Resumen de actividad del sistema</p>
        </div>

        {/* KPIs principales */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
          <div className='bg-white shadow rounded-lg p-5'>
            <div className='flex items-center gap-3 mb-2'>
              <Package className='h-5 w-5 text-gray-400' />
              <p className='text-sm text-gray-500'>Total pedidos</p>
            </div>
            <p className='text-3xl font-bold text-gray-900'>{stats.total}</p>
          </div>

          <div className='bg-white shadow rounded-lg p-5'>
            <div className='flex items-center gap-3 mb-2'>
              <TrendingUp className='h-5 w-5 text-green-500' />
              <p className='text-sm text-gray-500'>Tasa de completado</p>
            </div>
            <p className='text-3xl font-bold text-green-600'>{stats.completionRate}%</p>
          </div>

          <div className='bg-white shadow rounded-lg p-5'>
            <div className='flex items-center gap-3 mb-2'>
              <DollarSign className='h-5 w-5 text-blue-500' />
              <p className='text-sm text-gray-500'>Facturación total</p>
            </div>
            <p className='text-3xl font-bold text-blue-600'>${stats.totalRevenue.toLocaleString('es-UY', { minimumFractionDigits: 0 })}</p>
          </div>

          <div className='bg-white shadow rounded-lg p-5'>
            <div className='flex items-center gap-3 mb-2'>
              <AlertCircle className='h-5 w-5 text-red-500' />
              <p className='text-sm text-gray-500'>Vencidos</p>
            </div>
            <p className={`text-3xl font-bold ${stats.vencidos > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {stats.vencidos}
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
          {/* Pedidos por mes */}
          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-base font-semibold text-gray-900 mb-5'>Pedidos por mes (últimos 6 meses)</h2>
            <div className='space-y-4'>
              {byMonth.map((m) => (
                <div key={m.label}>
                  <div className='flex justify-between text-xs text-gray-500 mb-1'>
                    <span className='capitalize'>{m.label}</span>
                    <span>{m.completados}/{m.total} completados</span>
                  </div>
                  <div className='space-y-1'>
                    <Bar value={m.total} max={maxMonth} color='bg-blue-400' />
                    <Bar value={m.completados} max={maxMonth} color='bg-green-400' />
                  </div>
                </div>
              ))}
            </div>
            <div className='mt-4 flex gap-4 text-xs text-gray-500'>
              <span className='flex items-center gap-1'><span className='w-3 h-3 rounded-full bg-blue-400 inline-block' /> Total</span>
              <span className='flex items-center gap-1'><span className='w-3 h-3 rounded-full bg-green-400 inline-block' /> Completados</span>
            </div>
          </div>

          {/* Estado actual */}
          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-base font-semibold text-gray-900 mb-5'>Estado actual</h2>
            <div className='space-y-4'>
              {[
                { label: 'Pendientes', value: stats.pendientes, color: 'bg-yellow-400', icon: Clock },
                { label: 'En proceso', value: stats.enProceso, color: 'bg-blue-400', icon: Package },
                { label: 'Completados/Entregados', value: stats.completados, color: 'bg-green-400', icon: Check },
                { label: 'Cancelados', value: stats.cancelados, color: 'bg-red-300', icon: AlertCircle },
                { label: 'Vencidos', value: stats.vencidos, color: 'bg-red-500', icon: AlertCircle }
              ].map((s) => (
                <div key={s.label}>
                  <div className='flex justify-between text-xs text-gray-500 mb-1'>
                    <span>{s.label}</span>
                  </div>
                  <Bar value={s.value} max={stats.total || 1} color={s.color} />
                </div>
              ))}
            </div>

            <div className='mt-6 pt-4 border-t grid grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='text-gray-500 text-xs'>Pagados</p>
                <p className='font-semibold text-gray-900'>{stats.pagados} / {stats.total}</p>
              </div>
              <div>
                <p className='text-gray-500 text-xs'>Sin cobrar</p>
                <p className='font-semibold text-gray-900'>{stats.total - stats.pagados}</p>
              </div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Workers ranking */}
          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex items-center gap-2 mb-5'>
              <Users className='h-5 w-5 text-gray-400' />
              <h2 className='text-base font-semibold text-gray-900'>Workers más activos</h2>
            </div>
            {workerRanking.length === 0 ? (
              <p className='text-sm text-gray-400 text-center py-6'>Ningún pedido asignado aún</p>
            ) : (
              <div className='space-y-4'>
                {workerRanking.map((w, i) => (
                  <div key={w.name}>
                    <div className='flex justify-between text-xs text-gray-500 mb-1'>
                      <span className='font-medium text-gray-700'>#{i + 1} {w.name}</span>
                      <span>{w.completados} completados / {w.total} asignados</span>
                    </div>
                    <Bar value={w.completados} max={maxWorker} color='bg-purple-400' />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Métodos de pago */}
          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex items-center gap-2 mb-5'>
              <DollarSign className='h-5 w-5 text-gray-400' />
              <h2 className='text-base font-semibold text-gray-900'>Métodos de pago</h2>
            </div>
            {paymentBreakdown.length === 0 ? (
              <p className='text-sm text-gray-400 text-center py-6'>Sin datos</p>
            ) : (
              <div className='space-y-4'>
                {paymentBreakdown.map((p) => (
                  <div key={p.method}>
                    <div className='flex justify-between text-xs text-gray-500 mb-1'>
                      <span className='capitalize font-medium text-gray-700'>{p.method}</span>
                      <span>{Math.round((p.count / (stats.total - stats.cancelados || 1)) * 100)}%</span>
                    </div>
                    <Bar value={p.count} max={maxPayment} color='bg-indigo-400' />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

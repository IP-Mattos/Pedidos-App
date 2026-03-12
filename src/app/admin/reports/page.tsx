'use client'

import { useState, useMemo } from 'react'
import { BarChart3, TrendingUp, Package, Users, DollarSign, AlertCircle, Check, Clock, Download, Loader2 } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useOrders } from '@/hooks/use-orders'
import { useAuth } from '@/hooks/use-auth'

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = 'hoy' | 'semana' | 'mes' | 'todo'

const PERIODS: { id: Period; label: string }[] = [
  { id: 'hoy',    label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'mes',    label: 'Este mes' },
  { id: 'todo',   label: 'Histórico' },
]

const PERIOD_FULL_LABELS: Record<Period, string> = {
  hoy:    'Hoy',
  semana: 'Esta semana (últimos 7 días)',
  mes:    'Este mes',
  todo:   'Histórico (todo)',
}

// ─── Chart helpers ────────────────────────────────────────────────────────────

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

function VerticalBarChart({ data }: { data: { label: string; total: number; completados: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.total), 1)
  return (
    <div className='flex items-end gap-0.5 w-full' style={{ height: '160px', paddingTop: '48px' }}>
      {data.map((d) => {
        const totalPct = Math.round((d.total / maxVal) * 100)
        const compPct = d.total > 0 ? Math.round((d.completados / d.total) * 100) : 0
        return (
          <div key={d.label} className='flex-1 flex flex-col items-center gap-1 group' style={{ minWidth: 0 }}>
            <div className='relative w-full flex flex-col justify-end' style={{ height: '112px' }}>
              <div className='w-full bg-blue-100 rounded-t-sm transition-all duration-500' style={{ height: `${totalPct}%` }}>
                <div className='w-full bg-green-400 rounded-t-sm absolute bottom-0' style={{ height: `${(compPct / 100) * totalPct}%` }} />
              </div>
              <div className='absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none'>
                {d.total} total · {d.completados} completados
              </div>
            </div>
            <span className='text-gray-400 w-full text-center truncate' style={{ fontSize: '9px' }}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function StatusPieChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, sl) => s + sl.value, 0)
  if (total === 0) return <p className='text-sm text-gray-400 text-center py-6'>Sin datos</p>
  let cumulative = 0
  const conicParts: string[] = []
  slices.forEach((sl) => {
    const pct = (sl.value / total) * 100
    conicParts.push(`${sl.color} ${cumulative}% ${cumulative + pct}%`)
    cumulative += pct
  })
  return (
    <div className='flex flex-col items-center gap-4'>
      <div className='w-36 h-36 rounded-full' style={{ background: `conic-gradient(${conicParts.join(', ')})` }} />
      <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
        {slices.map((sl) => (
          <div key={sl.label} className='flex items-center gap-2 text-xs text-gray-600'>
            <span className='w-3 h-3 rounded-sm flex-shrink-0' style={{ background: sl.color }} />
            <span>{sl.label}: <strong>{sl.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const { orders, loading } = useOrders()
  const { profile } = useAuth()
  const [period, setPeriod] = useState<Period>('mes')
  const [pdfLoading, setPdfLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  // ── Filter orders by period ──────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    if (period === 'todo') return orders
    const now = new Date()
    let start: Date
    if (period === 'hoy') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (period === 'semana') {
      start = new Date(now)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
    } else {
      // mes
      start = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    return orders.filter((o) => new Date(o.created_at) >= start)
  }, [orders, period])

  // ── KPI stats ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filteredOrders.length
    const completados = filteredOrders.filter((o) => ['completado', 'entregado'].includes(o.status)).length
    const cancelados = filteredOrders.filter((o) => o.status === 'cancelado').length
    const pendientes = filteredOrders.filter((o) => o.status === 'pendiente').length
    const enProceso = filteredOrders.filter((o) => o.status === 'en_proceso').length
    const entregados = filteredOrders.filter((o) => o.status === 'entregado').length
    const pagados = filteredOrders.filter((o) => o.esta_pagado).length
    const vencidos = filteredOrders.filter(
      (o) => o.fecha_entrega.split('T')[0] < today && !['entregado', 'cancelado'].includes(o.status)
    ).length
    const totalRevenue = filteredOrders
      .filter((o) => o.status !== 'cancelado')
      .reduce((sum, o) => sum + o.monto_total, 0)
    const completionRate = total > 0 ? Math.round((completados / total) * 100) : 0
    return { total, completados, cancelados, pendientes, enProceso, entregados, vencidos, pagados, totalRevenue, completionRate }
  }, [filteredOrders, today])

  // ── Chart data based on period ───────────────────────────────────────────────
  const chartData = useMemo(() => {
    if (period === 'hoy') {
      const todayStr = new Date().toISOString().split('T')[0]
      const blocks = Array.from({ length: 6 }, (_, i) => ({
        label: `${String(i * 4).padStart(2, '0')}h`,
        total: 0,
        completados: 0,
      }))
      filteredOrders.forEach((o) => {
        if (o.created_at.split('T')[0] !== todayStr) return
        const h = new Date(o.created_at).getHours()
        const idx = Math.floor(h / 4)
        blocks[idx].total++
        if (['completado', 'entregado'].includes(o.status)) blocks[idx].completados++
      })
      return blocks
    }

    if (period === 'semana') {
      const map: Record<string, { label: string; total: number; completados: number }> = {}
      const now = new Date()
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const key = d.toISOString().split('T')[0]
        map[key] = { label: d.toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric' }), total: 0, completados: 0 }
      }
      filteredOrders.forEach((o) => {
        const key = o.created_at.split('T')[0]
        if (map[key]) {
          map[key].total++
          if (['completado', 'entregado'].includes(o.status)) map[key].completados++
        }
      })
      return Object.values(map)
    }

    if (period === 'mes') {
      const now = new Date()
      const map: Record<string, { label: string; total: number; completados: number }> = {}
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(now.getFullYear(), now.getMonth(), d)
        const key = date.toISOString().split('T')[0]
        map[key] = { label: String(d), total: 0, completados: 0 }
      }
      filteredOrders.forEach((o) => {
        const key = o.created_at.split('T')[0]
        if (map[key]) {
          map[key].total++
          if (['completado', 'entregado'].includes(o.status)) map[key].completados++
        }
      })
      return Object.values(map)
    }

    // todo: last 12 months
    const map: Record<string, { label: string; total: number; completados: number }> = {}
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      map[key] = { label: d.toLocaleDateString('es-UY', { month: 'short', year: '2-digit' }), total: 0, completados: 0 }
    }
    filteredOrders.forEach((o) => {
      const key = o.created_at.slice(0, 7)
      if (map[key]) {
        map[key].total++
        if (['completado', 'entregado'].includes(o.status)) map[key].completados++
      }
    })
    return Object.values(map)
  }, [filteredOrders, period])

  // ── Status pie slices ────────────────────────────────────────────────────────
  const statusSlices = useMemo(() => [
    { label: 'Pendiente',   value: stats.pendientes, color: '#FBBF24' },
    { label: 'En proceso',  value: stats.enProceso,  color: '#60A5FA' },
    { label: 'Completado',  value: stats.completados, color: '#34D399' },
    { label: 'Cancelado',   value: stats.cancelados,  color: '#F87171' },
  ].filter((s) => s.value > 0), [stats])

  // ── Workers ranking ──────────────────────────────────────────────────────────
  const workerRanking = useMemo(() => {
    const map: Record<string, { name: string; total: number; completados: number }> = {}
    filteredOrders.forEach((o) => {
      if (!o.assigned_to || !o.assignee) return
      if (!map[o.assigned_to]) map[o.assigned_to] = { name: o.assignee.full_name, total: 0, completados: 0 }
      map[o.assigned_to].total++
      if (['completado', 'entregado'].includes(o.status)) map[o.assigned_to].completados++
    })
    return Object.values(map).sort((a, b) => b.completados - a.completados)
  }, [filteredOrders])

  const maxWorker = Math.max(...workerRanking.map((w) => w.completados), 1)

  // ── Payment breakdown ────────────────────────────────────────────────────────
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    filteredOrders.filter((o) => o.status !== 'cancelado').forEach((o) => {
      map[o.metodo_pago] = (map[o.metodo_pago] ?? 0) + 1
    })
    return Object.entries(map).map(([method, count]) => ({ method, count })).sort((a, b) => b.count - a.count)
  }, [filteredOrders])

  const maxPayment = Math.max(...paymentBreakdown.map((p) => p.count), 1)

  // ── PDF export ───────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    setPdfLoading(true)
    try {
      const [{ pdf, Document, Page, Text, View, StyleSheet }, { saveAs }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('file-saver'),
      ])

      const styles = StyleSheet.create({
        page:            { padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
        title:           { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
        subtitle:        { fontSize: 10, color: '#6b7280', marginBottom: 20 },
        section:         { marginBottom: 18 },
        sectionTitle:    { fontSize: 13, fontWeight: 'bold', color: '#111827', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', borderBottomStyle: 'solid', paddingBottom: 4, marginBottom: 8 },
        kpiRow:          { flexDirection: 'row', gap: 8, marginBottom: 16 },
        kpiCard:         { flex: 1, padding: 10, backgroundColor: '#f9fafb', borderRadius: 6, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'solid' },
        kpiLabel:        { fontSize: 9, color: '#6b7280', marginBottom: 3 },
        kpiValue:        { fontSize: 17, fontWeight: 'bold', color: '#111827' },
        tableHeader:     { flexDirection: 'row', backgroundColor: '#f3f4f6', paddingVertical: 5, paddingHorizontal: 8, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
        tableRow:        { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', borderBottomStyle: 'solid' },
        tableHeaderCell: { flex: 1, fontSize: 8, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' },
        tableCell:       { flex: 1, fontSize: 9, color: '#374151' },
        footer:          { position: 'absolute', bottom: 28, left: 40, right: 40, fontSize: 8, color: '#9ca3af', textAlign: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', borderTopStyle: 'solid', paddingTop: 8 },
        badge:           { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: 'bold' },
      })

      const generated = new Date().toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

      const doc = (
        <Document title={`Reporte ${PERIOD_FULL_LABELS[period]}`}>
          <Page size='A4' style={styles.page}>

            {/* Header */}
            <View style={styles.section}>
              <Text style={styles.title}>Reporte de Pedidos</Text>
              <Text style={styles.subtitle}>Período: {PERIOD_FULL_LABELS[period]}  ·  Generado: {generated}</Text>
            </View>

            {/* KPIs */}
            <View style={styles.kpiRow}>
              {[
                { label: 'Total pedidos',   value: String(stats.total) },
                { label: 'Completados',      value: String(stats.completados) },
                { label: 'Tasa completado',  value: `${stats.completionRate}%` },
                { label: 'Facturación',      value: `$${stats.totalRevenue.toLocaleString('es-UY')}` },
              ].map((k) => (
                <View key={k.label} style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                  <Text style={styles.kpiValue}>{k.value}</Text>
                </View>
              ))}
            </View>

            {/* Estado de pedidos */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estado de pedidos</Text>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Estado</Text>
                <Text style={styles.tableHeaderCell}>Cantidad</Text>
                <Text style={styles.tableHeaderCell}>% del total</Text>
              </View>
              {[
                { label: 'Pendientes',     value: stats.pendientes },
                { label: 'En proceso',     value: stats.enProceso },
                { label: 'Completados',    value: stats.completados },
                { label: 'Cancelados',     value: stats.cancelados },
                { label: 'Vencidos',       value: stats.vencidos },
                { label: 'Pagados',        value: stats.pagados },
              ].map((s) => (
                <View key={s.label} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{s.label}</Text>
                  <Text style={styles.tableCell}>{s.value}</Text>
                  <Text style={styles.tableCell}>{stats.total > 0 ? Math.round((s.value / stats.total) * 100) : 0}%</Text>
                </View>
              ))}
            </View>

            {/* Workers */}
            {workerRanking.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Workers — ranking del período</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Worker</Text>
                  <Text style={styles.tableHeaderCell}>Asignados</Text>
                  <Text style={styles.tableHeaderCell}>Completados</Text>
                  <Text style={styles.tableHeaderCell}>Tasa</Text>
                </View>
                {workerRanking.slice(0, 15).map((w, i) => (
                  <View key={w.name} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>#{i + 1}  {w.name}</Text>
                    <Text style={styles.tableCell}>{w.total}</Text>
                    <Text style={styles.tableCell}>{w.completados}</Text>
                    <Text style={styles.tableCell}>{w.total > 0 ? Math.round((w.completados / w.total) * 100) : 0}%</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Métodos de pago */}
            {paymentBreakdown.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Métodos de pago</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Método</Text>
                  <Text style={styles.tableHeaderCell}>Pedidos</Text>
                  <Text style={styles.tableHeaderCell}>Porcentaje</Text>
                </View>
                {paymentBreakdown.map((p) => (
                  <View key={p.method} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{p.method}</Text>
                    <Text style={styles.tableCell}>{p.count}</Text>
                    <Text style={styles.tableCell}>
                      {stats.total - stats.cancelados > 0 ? Math.round((p.count / (stats.total - stats.cancelados)) * 100) : 0}%
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.footer}>Pedidos Patricia · Florida, Uruguay · {new Date().getFullYear()}</Text>
          </Page>
        </Document>
      )

      const blob = await pdf(doc).toBlob()
      const filename = `reporte-${period}-${today}.pdf`
      saveAs(blob, filename)
    } catch (err) {
      console.error('PDF error:', err)
    } finally {
      setPdfLoading(false)
    }
  }

  // ── Guards ───────────────────────────────────────────────────────────────────

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

  // ── Render ───────────────────────────────────────────────────────────────────

  const chartTitle: Record<Period, string> = {
    hoy:    'Pedidos por bloque horario',
    semana: 'Pedidos últimos 7 días',
    mes:    `Pedidos del mes (día a día)`,
    todo:   'Pedidos últimos 12 meses',
  }

  return (
    <MainLayout>
      <div className='max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>

        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Reportes</h1>
            <p className='mt-1 text-gray-600 text-sm'>Resumen de actividad · {PERIOD_FULL_LABELS[period]}</p>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading || stats.total === 0}
            className='flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {pdfLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Download className='h-4 w-4' />}
            {pdfLoading ? 'Generando…' : 'Descargar PDF'}
          </button>
        </div>

        {/* Period tabs */}
        <div className='flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit'>
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
          <div className='bg-white shadow rounded-lg p-5 min-w-0'>
            <div className='flex items-center gap-2 mb-2 min-w-0'>
              <Package className='h-5 w-5 text-gray-400 flex-shrink-0' />
              <p className='text-sm text-gray-500 truncate'>Total pedidos</p>
            </div>
            <p className='text-2xl font-bold text-gray-900 truncate'>{stats.total}</p>
          </div>
          <div className='bg-white shadow rounded-lg p-5 min-w-0'>
            <div className='flex items-center gap-2 mb-2 min-w-0'>
              <TrendingUp className='h-5 w-5 text-green-500 flex-shrink-0' />
              <p className='text-sm text-gray-500 truncate'>Completado</p>
            </div>
            <p className='text-2xl font-bold text-green-600 truncate'>{stats.completionRate}%</p>
          </div>
          <div className='bg-white shadow rounded-lg p-5 min-w-0'>
            <div className='flex items-center gap-2 mb-2 min-w-0'>
              <DollarSign className='h-5 w-5 text-blue-500 flex-shrink-0' />
              <p className='text-sm text-gray-500 truncate'>Facturación</p>
            </div>
            <p className='text-2xl font-bold text-blue-600 truncate'>
              ${stats.totalRevenue.toLocaleString('es-UY', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className='bg-white shadow rounded-lg p-5 min-w-0'>
            <div className='flex items-center gap-2 mb-2 min-w-0'>
              <AlertCircle className='h-5 w-5 text-red-500 flex-shrink-0' />
              <p className='text-sm text-gray-500 truncate'>Vencidos</p>
            </div>
            <p className={`text-2xl font-bold truncate ${stats.vencidos > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {stats.vencidos}
            </p>
          </div>
        </div>

        {/* Charts row 1 */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
          {/* Vertical bar chart */}
          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex items-center gap-2 mb-5'>
              <BarChart3 className='h-5 w-5 text-gray-400' />
              <h2 className='text-base font-semibold text-gray-900'>{chartTitle[period]}</h2>
            </div>
            {stats.total === 0 ? (
              <p className='text-sm text-gray-400 text-center py-10'>Sin pedidos en este período</p>
            ) : (
              <>
                <VerticalBarChart data={chartData} />
                <div className='mt-4 flex gap-4 text-xs text-gray-500'>
                  <span className='flex items-center gap-1'><span className='w-3 h-3 rounded-sm bg-blue-100 inline-block' /> Total</span>
                  <span className='flex items-center gap-1'><span className='w-3 h-3 rounded-sm bg-green-400 inline-block' /> Completados</span>
                </div>
              </>
            )}
          </div>

          {/* Status pie chart */}
          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex items-center gap-2 mb-5'>
              <Package className='h-5 w-5 text-gray-400' />
              <h2 className='text-base font-semibold text-gray-900'>Distribución por estado</h2>
            </div>
            <StatusPieChart slices={statusSlices} />
          </div>
        </div>

        {/* Charts row 2 */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
          {/* Estado actual */}
          <div className='bg-white shadow rounded-lg p-6'>
            <h2 className='text-base font-semibold text-gray-900 mb-5'>Desglose de estados</h2>
            {stats.total === 0 ? (
              <p className='text-sm text-gray-400 text-center py-6'>Sin datos</p>
            ) : (
              <>
                <div className='space-y-4'>
                  {[
                    { label: 'Pendientes',  value: stats.pendientes,  color: 'bg-yellow-400', icon: Clock },
                    { label: 'En proceso',  value: stats.enProceso,   color: 'bg-blue-400',   icon: Package },
                    { label: 'Completados', value: stats.completados, color: 'bg-green-400',  icon: Check },
                    { label: 'Cancelados',  value: stats.cancelados,  color: 'bg-red-300',    icon: AlertCircle },
                    { label: 'Vencidos',    value: stats.vencidos,    color: 'bg-red-500',    icon: AlertCircle },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className='flex justify-between text-xs text-gray-500 mb-1'>
                        <span>{s.label}</span>
                        <span className='text-gray-700 font-medium'>{s.value}</span>
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
              </>
            )}
          </div>

          {/* Workers */}
          <div className='bg-white shadow rounded-lg p-6'>
            <div className='flex items-center gap-2 mb-5'>
              <Users className='h-5 w-5 text-gray-400' />
              <h2 className='text-base font-semibold text-gray-900'>Workers más activos</h2>
            </div>
            {workerRanking.length === 0 ? (
              <p className='text-sm text-gray-400 text-center py-6'>Sin pedidos asignados en este período</p>
            ) : (
              <div className='space-y-4'>
                {workerRanking.map((w, i) => (
                  <div key={w.name}>
                    <div className='flex justify-between text-xs text-gray-500 mb-1 gap-2'>
                      <span className='font-medium text-gray-700 truncate'>#{i + 1} {w.name}</span>
                      <span className='flex-shrink-0'>{w.completados}/{w.total}</span>
                    </div>
                    <Bar value={w.completados} max={maxWorker} color='bg-purple-400' />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payments */}
        <div className='bg-white shadow rounded-lg p-6'>
          <div className='flex items-center gap-2 mb-5'>
            <DollarSign className='h-5 w-5 text-gray-400' />
            <h2 className='text-base font-semibold text-gray-900'>Métodos de pago</h2>
          </div>
          {paymentBreakdown.length === 0 ? (
            <p className='text-sm text-gray-400 text-center py-6'>Sin datos</p>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
    </MainLayout>
  )
}

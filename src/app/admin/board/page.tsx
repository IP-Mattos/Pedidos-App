'use client'

import { useState, useEffect, useCallback } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { createClient } from '@/lib/supabase/client'
import { OrdersService } from '@/lib/services/order-services'
import { ProductProgressService } from '@/lib/services/product-progress-services'
import { Order } from '@/types/database'
import { Clock, CheckCircle, Circle, RefreshCw, Package, AlertTriangle, ArrowLeftRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'

// ── Accent palette (one per worker) ──────────────────────────────────────────

const ACCENTS = [
  { avatar: 'bg-violet-500', headerBg: 'bg-violet-500', bar: 'bg-violet-400', text: 'text-violet-500' },
  { avatar: 'bg-sky-500',    headerBg: 'bg-sky-500',    bar: 'bg-sky-400',    text: 'text-sky-500'    },
  { avatar: 'bg-emerald-500',headerBg: 'bg-emerald-500',bar: 'bg-emerald-400',text: 'text-emerald-500'},
  { avatar: 'bg-rose-500',   headerBg: 'bg-rose-500',   bar: 'bg-rose-400',   text: 'text-rose-500'   },
  { avatar: 'bg-amber-500',  headerBg: 'bg-amber-500',  bar: 'bg-amber-400',  text: 'text-amber-500'  },
  { avatar: 'bg-indigo-500', headerBg: 'bg-indigo-500', bar: 'bg-indigo-400', text: 'text-indigo-500' },
  { avatar: 'bg-teal-500',   headerBg: 'bg-teal-500',   bar: 'bg-teal-400',   text: 'text-teal-500'   },
]

function accent(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return ACCENTS[h % ACCENTS.length]
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ProductItem = { producto: string; cantidad: number; precio: number }
type ProgMap    = Record<string, { done: number; total: number }>
type ProgDetail = { order_id: string; product_index: number; is_completed: boolean; notes?: string }

// ── Elapsed timer ─────────────────────────────────────────────────────────────

function useElapsed(iso: string | null | undefined): { label: string; urgent: boolean } {
  const [ms, setMs] = useState(0)
  useEffect(() => {
    if (!iso) return
    const start = new Date(iso).getTime()
    const tick = () => setMs(Date.now() - start)
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [iso])
  if (!iso || ms === 0) return { label: '', urgent: false }
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  const s = Math.floor((ms % 60000) / 1000)
  return {
    label: h > 0 ? `${h}h ${m}m` : `${m}m ${String(s).padStart(2, '0')}s`,
    urgent: totalMin >= 30,
  }
}

// ── Product row ───────────────────────────────────────────────────────────────

function ProductRow({ product, prog }: { product: ProductItem; prog?: ProgDetail }) {
  const isFalta  = !!prog?.notes?.startsWith('FALTA:')
  const isCambio = !!prog?.notes?.startsWith('CAMBIO:')
  const isDone   = !!prog?.is_completed && !isFalta

  return (
    <div className={`flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-sm font-medium ${
      isFalta  ? 'bg-red-50 text-red-600' :
      isCambio ? 'bg-amber-50 text-amber-700' :
      isDone   ? 'bg-emerald-50 text-emerald-700' :
      'bg-gray-50 text-gray-600'
    }`}>
      <span className='flex-shrink-0'>
        {isFalta  ? <AlertTriangle  className='h-4 w-4 text-red-400' /> :
         isCambio ? <ArrowLeftRight className='h-4 w-4 text-amber-400' /> :
         isDone   ? <CheckCircle    className='h-4 w-4 text-emerald-500' /> :
                    <Circle         className='h-4 w-4 text-gray-300' />}
      </span>
      <span className={`flex-1 truncate ${isDone ? 'line-through opacity-50' : ''}`}>
        <span className='font-extrabold'>{product.cantidad}×</span> {product.producto}
      </span>
      {isCambio && (
        <span className='flex-shrink-0 font-bold text-amber-500 truncate max-w-[90px]'>
          → {prog?.notes?.replace('CAMBIO:', '').split('|')[0].trim()}
        </span>
      )}
    </div>
  )
}

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({
  order, progSummary, progDetail, accentBar,
}: {
  order: Order; progSummary?: { done: number; total: number }; progDetail: ProgDetail[]; accentBar: string
}) {
  const { label: elapsed, urgent } = useElapsed(order.assigned_at)
  const products: ProductItem[] = order.lista_productos ?? []
  const done    = progSummary?.done  ?? 0
  const total   = progSummary?.total ?? products.length
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0
  const allDone = pct === 100 && total > 0

  return (
    <div className={`bg-white rounded-2xl overflow-hidden transition-all ${
      urgent
        ? 'shadow-lg ring-2 ring-red-300'
        : 'shadow-md hover:shadow-xl ring-1 ring-gray-200'
    }`}>

      {/* Colored top stripe */}
      <div className={`h-2 ${allDone ? 'bg-emerald-400' : urgent ? 'bg-red-400' : accentBar}`} />

      {/* Header */}
      <div className='px-5 pt-4 pb-3 flex items-start justify-between gap-2'>
        <div className='min-w-0'>
          <p className='font-extrabold text-gray-900 text-base leading-snug truncate'>{order.nombre_cliente}</p>
          <span className='inline-block mt-1 text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md'>
            #{order.id.slice(-6)}
          </span>
        </div>
        <div className='flex items-center gap-2 flex-shrink-0 mt-0.5'>
          {elapsed && (
            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
              urgent ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
            }`}>
              <Clock className='h-3.5 w-3.5' />
              {elapsed}
            </span>
          )}
          <Link href={`/admin/orders/${order.id}`} onClick={(e) => e.stopPropagation()} title='Ver pedido'>
            <ExternalLink className='h-4 w-4 text-gray-300 hover:text-gray-600 transition-colors' />
          </Link>
        </div>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className='px-5 pb-4'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-xs text-gray-500 font-semibold'>{done} de {total} productos</span>
            <span className={`text-sm font-extrabold tabular-nums ${
              allDone ? 'text-emerald-500' : urgent ? 'text-red-500' : 'text-gray-600'
            }`}>{pct}%</span>
          </div>
          <div className='w-full bg-gray-100 rounded-full h-2.5 overflow-hidden'>
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ease-out ${
                allDone ? 'bg-emerald-400' : urgent ? 'bg-red-400' : accentBar
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Separator */}
      <div className='mx-5 h-px bg-gray-100' />

      {/* Products */}
      <div className='p-4 space-y-2'>
        {products.map((p, i) => (
          <ProductRow key={i} product={p} prog={progDetail.find((d) => d.product_index === i)} />
        ))}
      </div>

      {/* Notes */}
      {order.notas && (
        <div className='px-5 pb-4'>
          <p className='text-xs text-gray-400 italic truncate'>📝 {order.notas}</p>
        </div>
      )}
    </div>
  )
}

// ── Worker column ─────────────────────────────────────────────────────────────

function WorkerColumn({
  workerName, orders, progSummary, progDetail,
}: {
  workerName: string; orders: Order[]; progSummary: ProgMap; progDetail: ProgDetail[]
}) {
  const ac = accent(workerName)
  const totalDone    = orders.reduce((s, o) => s + (progSummary[o.id]?.done ?? 0), 0)
  const totalProducts = orders.reduce((s, o) => s + (progSummary[o.id]?.total ?? 0), 0)
  const colPct = totalProducts > 0 ? Math.round((totalDone / totalProducts) * 100) : 0
  const allDone = colPct === 100 && totalProducts > 0

  return (
    <div className='flex flex-col gap-4 w-80 flex-shrink-0'>

      {/* Worker header card */}
      <div className={`${ac.headerBg} rounded-2xl p-4 shadow`}>
        <div className='flex items-center gap-3'>
          {/* Avatar */}
          <div className='w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white font-extrabold text-base flex-shrink-0 shadow-inner'>
            {initials(workerName)}
          </div>
          <div className='flex-1 min-w-0'>
            <p className='font-extrabold text-white text-base leading-tight truncate'>{workerName}</p>
            <p className='text-white/70 text-xs mt-0.5'>
              {orders.length} pedido{orders.length !== 1 ? 's' : ''} · {totalDone}/{totalProducts} ítems
            </p>
          </div>
          {allDone && (
            <span className='flex items-center gap-1 bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0'>
              <CheckCircle className='h-3.5 w-3.5' /> Listo
            </span>
          )}
        </div>

        {/* Mini progress bar */}
        {totalProducts > 0 && (
          <div className='mt-3'>
            <div className='w-full bg-white/20 rounded-full h-1.5 overflow-hidden'>
              <div
                className='h-1.5 rounded-full bg-white transition-all duration-700'
                style={{ width: `${colPct}%` }}
              />
            </div>
            <p className='text-right text-[10px] text-white/60 font-bold mt-0.5'>{colPct}%</p>
          </div>
        )}
      </div>

      {/* Order cards */}
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          progSummary={progSummary[order.id]}
          progDetail={progDetail.filter((d) => d.order_id === order.id)}
          accentBar={ac.bar}
        />
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminBoardPage() {
  const [orders, setOrders]           = useState<Order[]>([])
  const [progSummary, setProgSummary] = useState<ProgMap>({})
  const [progDetail, setProgDetail]   = useState<ProgDetail[]>([])
  const [loading, setLoading]         = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const supabase = createClient()

  const loadOrders = useCallback(async () => {
    try {
      const data   = await OrdersService.getOrdersWithAssignments()
      const active = (data ?? []).filter((o) => o.status === 'en_proceso' && o.assigned_to)
      setOrders(active)
      const ids = active.map((o) => o.id)
      const [summary, detail] = await Promise.all([
        ProductProgressService.getProgressForOrders(ids),
        ids.length > 0
          ? createClient()
              .from('order_product_progress')
              .select('order_id, product_index, is_completed, notes')
              .in('order_id', ids)
              .then(({ data: d }) => (d ?? []) as ProgDetail[])
          : Promise.resolve([] as ProgDetail[]),
      ])
      setProgSummary(summary)
      setProgDetail(detail)
      setLastUpdated(new Date())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    loadOrders()
    const ch = supabase
      .channel('board-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_product_progress' }, () => loadOrders())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadOrders, supabase])

  const byWorker: Record<string, Order[]> = {}
  for (const o of orders) {
    const name = (o as any).assignee?.full_name ?? 'Sin asignar'
    if (!byWorker[name]) byWorker[name] = []
    byWorker[name].push(o)
  }
  const workers = Object.keys(byWorker).sort()

  return (
    <MainLayout>
      <div className='min-h-screen bg-gray-100'>

        {/* Top bar */}
        <div className='bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between sticky top-0 z-10'>
          <div className='flex items-center gap-3'>
            {/* Live indicator */}
            <span className='relative flex h-2.5 w-2.5'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
              <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500' />
            </span>
            <div>
              <h1 className='text-sm font-extrabold text-gray-900 leading-tight tracking-tight'>Panel de preparación</h1>
              <p className='text-[11px] text-gray-400'>
                {lastUpdated
                  ? `Actualizado ${lastUpdated.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : 'Cargando...'}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {!loading && workers.length > 0 && (
              <div className='hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-gray-500'>
                <span className='bg-gray-100 px-2.5 py-1 rounded-full'>{orders.length} pedidos</span>
                <span className='bg-gray-100 px-2.5 py-1 rounded-full'>{workers.length} workers</span>
              </div>
            )}
            <button
              onClick={loadOrders}
              className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors'
            >
              <RefreshCw className='h-3.5 w-3.5' />
              Refrescar
            </button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className='flex items-center justify-center h-72'>
            <div className='flex flex-col items-center gap-3'>
              <div className='animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-blue-500' />
              <p className='text-sm text-gray-400 font-medium'>Cargando panel...</p>
            </div>
          </div>
        ) : workers.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-72 text-center px-6'>
            <div className='w-20 h-20 rounded-3xl bg-white shadow-sm border border-gray-200 flex items-center justify-center mb-5'>
              <Package className='h-10 w-10 text-gray-300' />
            </div>
            <p className='text-lg font-bold text-gray-700'>Sin pedidos en preparación</p>
            <p className='text-sm text-gray-400 mt-1.5 max-w-xs'>
              Cuando un worker tome un pedido, aparecerá aquí en tiempo real.
            </p>
          </div>
        ) : (
          <div className='p-6 overflow-x-auto'>
            <div className='flex gap-5 items-start justify-center flex-wrap xl:flex-nowrap min-h-[200px]'>
              {workers.map((name) => (
                <WorkerColumn
                  key={name}
                  workerName={name}
                  orders={byWorker[name]}
                  progSummary={progSummary}
                  progDetail={progDetail}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { RefreshCw, CheckCircle, Clock, Zap, Users, TrendingUp, Activity } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { useAuth } from '@/hooks/use-auth'
import { OrdersService } from '@/lib/services/order-services'
import { createClient } from '@/lib/supabase/client'

type RankingPeriod = 'today' | 'week' | 'month' | 'all'

type WorkerStat = {
  id: string
  full_name: string
  email: string
  completed: number
  inProgress: number
  completedToday: number
  avgTimeMs: number | null
  score: number
  total: number
}

function formatAvgTime(ms: number | null): string {
  if (!ms || ms <= 0) return '—'
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const palettes = [
    'from-rose-400 to-rose-600',
    'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600',
    'from-violet-400 to-violet-600',
    'from-amber-400 to-amber-600',
    'from-pink-400 to-pink-600',
    'from-cyan-400 to-cyan-600',
    'from-indigo-400 to-indigo-600',
  ]
  const color = palettes[name.charCodeAt(0) % palettes.length]
  const sz =
    size === 'xl' ? 'h-20 w-20 text-2xl' :
    size === 'lg' ? 'h-14 w-14 text-lg' :
    size === 'sm' ? 'h-8 w-8 text-xs' :
    'h-11 w-11 text-sm'
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white flex-shrink-0 shadow-md`}>
      {initials}
    </div>
  )
}

const MEDAL = ['🥇', '🥈', '🥉']
const PODIUM_HEIGHTS = ['h-32', 'h-24', 'h-20']
const PODIUM_BG = [
  'bg-gradient-to-b from-yellow-300 to-yellow-500 shadow-yellow-200',
  'bg-gradient-to-b from-slate-300 to-slate-400 shadow-slate-200',
  'bg-gradient-to-b from-orange-300 to-orange-500 shadow-orange-200',
]
const PODIUM_CARD = [
  'ring-2 ring-yellow-400 bg-yellow-50',
  'ring-2 ring-slate-300 bg-slate-50',
  'ring-2 ring-orange-400 bg-orange-50',
]
const PODIUM_ORDER = [1, 0, 2] // visual order: 2nd, 1st, 3rd

function Podium({ top3 }: { top3: WorkerStat[] }) {
  return (
    <div className='flex items-end justify-center gap-4 mb-8'>
      {PODIUM_ORDER.map((dataIdx) => {
        const w = top3[dataIdx]
        if (!w) return <div key={dataIdx} className='w-40' />
        return (
          <Link key={w.id} href={`/admin/ranking/${w.id}`} className='flex flex-col items-center gap-2 w-40 group'>
            <span className='text-3xl'>{MEDAL[dataIdx]}</span>
            <Avatar name={w.full_name} size={dataIdx === 0 ? 'xl' : 'lg'} />
            <div className={`w-full text-center rounded-xl px-3 py-2 transition-opacity group-hover:opacity-80 ${PODIUM_CARD[dataIdx]}`}>
              <p className='text-sm font-bold text-gray-900 truncate'>{w.full_name}</p>
              <p className='text-xs text-gray-500'>{w.completed} completados</p>
              {w.completedToday > 0 && (
                <p className='text-xs font-medium text-emerald-600'>+{w.completedToday} hoy</p>
              )}
            </div>
            <div className={`w-full rounded-t-xl shadow-lg ${PODIUM_BG[dataIdx]} ${PODIUM_HEIGHTS[dataIdx]}`} />
          </Link>
        )
      })}
    </div>
  )
}

function ScoreBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? Math.round((Math.max(0, score) / Math.max(1, maxScore)) * 100) : 0
  return (
    <div className='flex items-center gap-2 min-w-0'>
      <div className='flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden'>
        <div
          className='h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700'
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className='text-xs text-gray-400 w-8 text-right flex-shrink-0'>{pct}%</span>
    </div>
  )
}

function LiveDot() {
  return (
    <span className='relative flex h-2.5 w-2.5'>
      <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75' />
      <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500' />
    </span>
  )
}

const PERIOD_LABELS: Record<RankingPeriod, string> = {
  today: 'Hoy',
  week: 'Esta semana',
  month: 'Este mes',
  all: 'Todo'
}

export default function RankingPage() {
  const { profile } = useAuth()
  const [workers, setWorkers] = useState<WorkerStat[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [period, setPeriod] = useState<RankingPeriod>('all')

  const load = useCallback(async (manual = false, currentPeriod: RankingPeriod = 'all') => {
    if (manual) setRefreshing(true)
    try {
      const data = await OrdersService.getWorkerRanking(currentPeriod)
      setWorkers(data as WorkerStat[])
      setLastUpdated(new Date())
      setSecondsAgo(0)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load + auto-refresh every 30s
  useEffect(() => {
    load(false, period)
    const interval = setInterval(() => load(false, period), 30000)
    return () => clearInterval(interval)
  }, [load, period])

  // Realtime subscription for orders changes
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('ranking-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        load(false, period)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [load, period])

  // Seconds-ago counter
  useEffect(() => {
    if (!lastUpdated) return
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(tick)
  }, [lastUpdated])

  if (profile?.role !== 'admin') {
    return (
      <MainLayout>
        <div className='max-w-4xl mx-auto py-12 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Acceso Denegado</h1>
        </div>
      </MainLayout>
    )
  }

  const top3 = workers.slice(0, 3)
  const rest = workers.slice(3)
  const maxScore = workers[0]?.score ?? 1

  const totalCompleted = workers.reduce((s, w) => s + w.completed, 0)
  const totalInProgress = workers.reduce((s, w) => s + w.inProgress, 0)
  const totalToday = workers.reduce((s, w) => s + w.completedToday, 0)

  return (
    <MainLayout>
      <div className='max-w-5xl mx-auto py-6 px-4 sm:px-6'>

        {/* Header */}
        <div className='flex flex-wrap items-start justify-between gap-4 mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>🏆 Ranking de Trabajadores</h1>
            <p className='mt-1 text-gray-500 text-sm'>Basado en pedidos completados y tiempo promedio</p>
          </div>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm'>
              <LiveDot />
              <span>En vivo</span>
              {lastUpdated && (
                <span className='text-gray-400'>· hace {secondsAgo}s</span>
              )}
            </div>
            <button
              onClick={() => load(true, period)}
              disabled={refreshing}
              className='inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 bg-white shadow-sm transition-colors'
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        {/* Period filter pills */}
        <div className='flex flex-wrap items-center gap-2 mb-8'>
          {(Object.keys(PERIOD_LABELS) as RankingPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-sm rounded-full font-medium transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Summary stats */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8'>
          {[
            { label: 'Trabajadores', value: workers.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Completados total', value: totalCompleted, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Completados hoy', value: totalToday, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'En proceso', value: totalInProgress, icon: Activity, color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 shadow-sm border border-white`}>
              <div className='flex items-center gap-2 mb-1'>
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <p className='text-xs text-gray-500'>{s.label}</p>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className='flex justify-center py-24'>
            <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600' />
          </div>
        ) : workers.length === 0 ? (
          <div className='text-center py-24'>
            <Users className='mx-auto h-12 w-12 text-gray-300' />
            <p className='mt-3 text-gray-500'>No hay trabajadores con pedidos aún.</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 1 && (
              <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6'>
                <h2 className='text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8'>Top 3</h2>
                <Podium top3={top3} />
              </div>
            )}

            {/* Full ranking table */}
            <div className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden'>
              <div className='px-6 py-4 border-b border-gray-100 flex items-center gap-2'>
                <TrendingUp className='h-4 w-4 text-gray-400' />
                <h2 className='text-sm font-semibold text-gray-700'>Ranking completo</h2>
                <span className='ml-auto text-xs text-gray-400'>Periodo: {PERIOD_LABELS[period]}</span>
              </div>

              <div className='divide-y divide-gray-50'>
                {workers.map((w, i) => (
                  <Link
                    key={w.id}
                    href={`/admin/ranking/${w.id}`}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-blue-50/60 cursor-pointer ${i < 3 ? 'bg-gray-50/50' : ''}`}
                  >
                    {/* Rank */}
                    <div className='w-8 flex-shrink-0 text-center'>
                      {i < 3 ? (
                        <span className='text-xl'>{MEDAL[i]}</span>
                      ) : (
                        <span className='text-sm font-bold text-gray-400'>#{i + 1}</span>
                      )}
                    </div>

                    {/* Avatar + name */}
                    <Avatar name={w.full_name} size='sm' />
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-semibold text-gray-900 truncate'>{w.full_name}</p>
                      <ScoreBar score={w.score} maxScore={maxScore} />
                    </div>

                    {/* Stats */}
                    <div className='hidden sm:flex items-center gap-6 flex-shrink-0'>
                      <div className='text-center'>
                        <p className='text-xs text-gray-400'>Completados</p>
                        <p className='text-sm font-bold text-emerald-600'>{w.completed}</p>
                      </div>
                      <div className='text-center'>
                        <p className='text-xs text-gray-400'>Hoy</p>
                        <p className={`text-sm font-bold ${w.completedToday > 0 ? 'text-amber-500' : 'text-gray-300'}`}>
                          {w.completedToday > 0 ? `+${w.completedToday}` : '—'}
                        </p>
                      </div>
                      <div className='text-center'>
                        <p className='text-xs text-gray-400'>En proceso</p>
                        <p className={`text-sm font-bold ${w.inProgress > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                          {w.inProgress || '—'}
                        </p>
                      </div>
                      <div className='text-center'>
                        <p className='text-xs text-gray-400 flex items-center gap-1'><Clock className='h-3 w-3' /> Prom.</p>
                        <p className='text-sm font-bold text-gray-600'>{formatAvgTime(w.avgTimeMs)}</p>
                      </div>
                    </div>

                    {/* Mobile condensed stats */}
                    <div className='sm:hidden text-right flex-shrink-0'>
                      <p className='text-sm font-bold text-emerald-600'>{w.completed} ✓</p>
                      <p className='text-xs text-gray-400'>{formatAvgTime(w.avgTimeMs)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <p className='mt-4 text-center text-xs text-gray-400'>
              Se actualiza automáticamente · Puntuación = pedidos completados − tiempo promedio
            </p>
          </>
        )}
      </div>
    </MainLayout>
  )
}

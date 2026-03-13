'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  BookOpen, ChevronRight, Package, Users, BarChart3, Trophy, Settings,
  Plus, Search, Filter, CheckCircle, Truck, MapPin,
  Bell, ArrowRight, Hash, Zap, Shield, RefreshCw,
  Eye, Edit, Trash2, ChevronDown, AlertCircle, List,
  Sparkles, Camera, FileText, Keyboard, DollarSign, UserRound,
  MessageCircle, Link2, ExternalLink, Phone
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { useAuth } from '@/hooks/use-auth'

// ─── Types ───────────────────────────────────────────────────────────────────

type Section = { id: string; label: string; icon: React.ElementType }

// ─── All sections ─────────────────────────────────────────────────────────────

const ALL_SECTIONS: Section[] = [
  { id: 'intro',          label: 'Introducción',         icon: BookOpen },
  { id: 'roles',          label: 'Roles de usuario',     icon: Shield },
  { id: 'flujo',          label: 'Flujo de un pedido',   icon: ArrowRight },
  { id: 'admin-dash',     label: 'Dashboard (Admin)',    icon: Hash },
  { id: 'crear-pedido',   label: 'Crear pedido',         icon: Plus },
  { id: 'ia-productos',   label: 'IA para productos',    icon: Sparkles },
  { id: 'admin-pedidos',  label: 'Lista de pedidos',     icon: Package },
  { id: 'admin-detalle',  label: 'Detalle de pedido',    icon: Eye },
  { id: 'clientes',       label: 'Clientes',             icon: UserRound },
  { id: 'ranking',        label: 'Ranking de workers',   icon: Trophy },
  { id: 'reportes',       label: 'Reportes',             icon: BarChart3 },
  { id: 'usuarios',       label: 'Usuarios',             icon: Users },
  { id: 'tracking',       label: 'Link de seguimiento',  icon: Link2 },
  { id: 'demo',           label: 'Demo pública',         icon: ExternalLink },
  { id: 'worker',         label: 'Worker — Pedidos',     icon: CheckCircle },
  { id: 'delivery',       label: 'Delivery',             icon: Truck },
  { id: 'config',         label: 'Configuración',        icon: Settings },
  { id: 'notificaciones', label: 'Notificaciones',       icon: Bell },
  { id: 'tiempo-real',    label: 'Tiempo real',          icon: Zap },
  { id: 'costos',         label: 'Costos del sistema',   icon: DollarSign },
  { id: 'valor',          label: '¿Por qué vale?',       icon: Zap },
  { id: 'precios',        label: 'Precios de la app',    icon: Sparkles },
]

const ROLE_SECTIONS: Record<string, string[]> = {
  admin:    ['intro', 'roles', 'flujo', 'admin-dash', 'crear-pedido', 'ia-productos', 'admin-pedidos', 'admin-detalle', 'clientes', 'ranking', 'reportes', 'usuarios', 'tracking', 'demo', 'worker', 'delivery', 'config', 'notificaciones', 'tiempo-real', 'costos', 'valor', 'precios'],
  worker:   ['intro', 'worker', 'notificaciones', 'config', 'tiempo-real'],
  delivery: ['intro', 'delivery', 'config'],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionTitle({ id, icon: Icon, children }: { id: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div id={id} className='flex items-center gap-3 mb-5 pt-2'>
      <div className='p-2 bg-red-100 rounded-lg flex-shrink-0'>
        <Icon className='h-4 w-4 sm:h-5 sm:w-5 text-red-600' />
      </div>
      <h2 className='text-lg sm:text-2xl font-bold text-gray-900 leading-tight'>{children}</h2>
    </div>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className='text-base font-semibold text-gray-800 mb-2 mt-5'>{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className='text-sm text-gray-600 leading-relaxed mb-3'>{children}</p>
}

function StepList({ steps }: { steps: { title: string; desc: string }[] }) {
  return (
    <ol className='space-y-3 mb-4'>
      {steps.map((s, i) => (
        <li key={i} className='flex gap-3 items-start'>
          <span className='flex-shrink-0 w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center mt-0.5'>{i + 1}</span>
          <div>
            <span className='text-sm font-semibold text-gray-800'>{s.title}</span>
            {s.desc && <p className='text-xs text-gray-500 mt-0.5'>{s.desc}</p>}
          </div>
        </li>
      ))}
    </ol>
  )
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {children}
    </span>
  )
}

function InfoBox({ type = 'info', children }: { type?: 'info' | 'tip' | 'warn'; children: React.ReactNode }) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    tip:  'bg-emerald-50 border-emerald-200 text-emerald-800',
    warn: 'bg-amber-50 border-amber-200 text-amber-800',
  }
  const icons = { info: AlertCircle, tip: CheckCircle, warn: AlertCircle }
  const Icon = icons[type]
  return (
    <div className={`flex gap-2.5 border rounded-lg px-4 py-3 mb-4 text-sm ${styles[type]}`}>
      <Icon className='h-4 w-4 flex-shrink-0 mt-0.5' />
      <span className='leading-relaxed'>{children}</span>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pendiente:  'bg-yellow-100 text-yellow-800',
    en_proceso: 'bg-blue-100 text-blue-800',
    completado: 'bg-emerald-100 text-emerald-800',
    pagado:     'bg-cyan-100 text-cyan-800',
    entregado:  'bg-purple-100 text-purple-800',
    cancelado:  'bg-red-100 text-red-800',
    vencido:    'bg-orange-100 text-orange-800',
  }
  const labels: Record<string, string> = {
    pendiente: 'Pendiente', en_proceso: 'En proceso', completado: 'Completado',
    pagado: 'Pagado', entregado: 'Entregado', cancelado: 'Cancelado', vencido: 'Vencido',
  }
  return <Badge color={map[status] ?? 'bg-gray-100 text-gray-700'}>{labels[status] ?? status}</Badge>
}

function RoleTag({ role }: { role: 'admin' | 'worker' | 'delivery' }) {
  const s = {
    admin:    'bg-red-100 text-red-700',
    worker:   'bg-blue-100 text-blue-700',
    delivery: 'bg-amber-100 text-amber-700',
  }
  const l = { admin: '👑 Admin', worker: '👷 Worker', delivery: '🚚 Delivery' }
  return <Badge color={s[role]}>{l[role]}</Badge>
}

function FeatureGrid({ items }: { items: { icon: React.ElementType; title: string; desc: string }[] }) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4'>
      {items.map((f) => (
        <div key={f.title} className='bg-gray-50 rounded-xl p-4 border border-gray-100'>
          <div className='flex items-center gap-2 mb-1.5'>
            <f.icon className='h-4 w-4 text-red-500' />
            <span className='text-sm font-semibold text-gray-800'>{f.title}</span>
          </div>
          <p className='text-xs text-gray-500 leading-relaxed'>{f.desc}</p>
        </div>
      ))}
    </div>
  )
}

function Divider() {
  return <hr className='my-10 border-gray-100' />
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function GuiaPage() {
  const { profile } = useAuth()
  const role = profile?.role ?? 'worker'

  const sections = useMemo(() => {
    const allowed = new Set(ROLE_SECTIONS[role] ?? ROLE_SECTIONS.worker)
    return ALL_SECTIONS.filter(s => allowed.has(s.id))
  }, [role])

  const [active, setActive] = useState('intro')
  const [mobileOpen, setMobileOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observerRef.current?.observe(el)
    })
    return () => observerRef.current?.disconnect()
  }, [sections])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileOpen(false)
  }

  const roleBanner = {
    admin:    { color: 'bg-red-50 border-red-200 text-red-800',     label: '👑 Administrador', desc: 'Estás viendo la guía completa con todas las funciones del sistema.' },
    worker:   { color: 'bg-blue-50 border-blue-200 text-blue-800',   label: '👷 Worker',        desc: 'Estás viendo la guía personalizada para tu rol.' },
    delivery: { color: 'bg-amber-50 border-amber-200 text-amber-800', label: '🚚 Delivery',      desc: 'Estás viendo la guía personalizada para tu rol.' },
  }[role]

  return (
    <MainLayout>
      <div className='max-w-7xl mx-auto px-4 py-8'>

        {/* Page header */}
        <div className='mb-6'>
          <div className='flex items-center gap-2 text-sm text-gray-400 mb-3'>
            <Link href='/' className='hover:text-gray-600'>Inicio</Link>
            <ChevronRight className='h-3.5 w-3.5' />
            <span className='text-gray-700'>Guía de uso</span>
          </div>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Manual de usuario</h1>
          <p className='text-gray-500 mt-1 text-sm'>Guía completa de todas las funciones de Pedidos Patricia.</p>
        </div>

        {/* Role banner */}
        {roleBanner && (
          <div className={`flex items-center gap-3 border rounded-xl px-4 py-3 mb-6 text-sm ${roleBanner.color}`}>
            <span className='font-semibold'>{roleBanner.label}</span>
            <span className='hidden sm:inline'>·</span>
            <span className='hidden sm:inline'>{roleBanner.desc}</span>
          </div>
        )}

        {/* Mobile TOC toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className='lg:hidden w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl mb-4 text-sm font-medium text-gray-700'
        >
          <span className='flex items-center gap-2'><List className='h-4 w-4' />Tabla de contenidos</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
        </button>
        {mobileOpen && (
          <div className='lg:hidden bg-white border border-gray-200 rounded-xl p-2 mb-4'>
            {sections.map((s) => (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${active === s.id ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                <s.icon className='h-3.5 w-3.5 flex-shrink-0' />{s.label}
              </button>
            ))}
          </div>
        )}

        <div className='flex gap-8'>

          {/* Sidebar */}
          <aside className='hidden lg:block w-56 flex-shrink-0'>
            <div className='sticky top-6 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm'>
              <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2'>Contenido</p>
              <nav className='space-y-0.5'>
                {sections.map((s) => (
                  <button key={s.id} onClick={() => scrollTo(s.id)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${active === s.id ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
                    <s.icon className='h-3.5 w-3.5 flex-shrink-0' />{s.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className='flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-8'>

            {/* ── INTRO ── */}
            <SectionTitle id='intro' icon={BookOpen}>Introducción</SectionTitle>
            <P>
              <strong>Pedidos Patricia</strong> es una plataforma web para gestionar pedidos de principio a fin. Centraliza la creación, seguimiento, procesamiento y entrega de pedidos, con visibilidad en tiempo real para cada integrante del equipo.
            </P>
            <P>
              El sistema funciona con tres roles bien definidos: el <strong>Administrador</strong> crea y supervisa todo, los <strong>Workers</strong> procesan los pedidos, y el equipo de <strong>Delivery</strong> gestiona el cobro y la entrega.
            </P>
            <FeatureGrid items={[
              { icon: Zap,            title: 'Tiempo real',           desc: 'Los cambios de estado se reflejan al instante gracias a Supabase Realtime.' },
              { icon: Shield,         title: 'Roles y accesos',       desc: 'Cada usuario solo ve y puede hacer lo que le corresponde.' },
              { icon: MapPin,         title: 'Dirección',             desc: 'Autocompletado de dirección restringido a Florida, Uruguay.' },
              { icon: Bell,           title: 'Notificaciones',        desc: 'Los workers reciben alertas del browser cuando llega un pedido nuevo.' },
              { icon: Sparkles,       title: 'IA para productos',     desc: 'Pegá un mensaje de WhatsApp o subí una foto y la IA extrae los productos automáticamente.' },
              { icon: Camera,         title: 'Escaneo de imagen',     desc: 'Claude lee listas escritas a mano, tickets o fotos de pedidos y los carga al sistema.' },
              { icon: Link2,          title: 'Link de seguimiento',   desc: 'Cada pedido tiene un link público para que el cliente vea el progreso en tiempo real sin iniciar sesión.' },
              { icon: ExternalLink,   title: 'Demo pública',          desc: 'Formulario público para que cualquier cliente haga su pedido directamente desde un link compartido.' },
              { icon: MessageCircle,  title: 'Integración WhatsApp',  desc: 'Enviá el link de seguimiento por WhatsApp al cliente con un solo click desde el detalle del pedido.' },
              { icon: Phone,          title: 'Teléfono en perfiles',  desc: 'Workers y delivery tienen número de teléfono editable. Aparece como link directo a WhatsApp.' },
            ]} />

            <Divider />

            {/* ── ROLES ── (admin only) */}
            {role === 'admin' && (
              <>
                <SectionTitle id='roles' icon={Shield}>Roles de usuario</SectionTitle>
                <P>Al registrarse, cada cuenta tiene un rol asignado por el administrador. El rol determina qué páginas puede ver y qué acciones puede realizar.</P>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                  {[
                    {
                      role: 'admin' as const,
                      emoji: '👑', color: 'border-red-200 bg-red-50',
                      title: 'Administrador',
                      items: ['Dashboard con métricas', 'Crear y editar pedidos', 'Asignar workers', 'Ver todos los pedidos', 'Gestión de clientes', 'Ranking de workers', 'Reportes y gráficos', 'Gestión de usuarios', 'Editar perfil de workers/delivery', 'Compartir link de seguimiento al cliente'],
                    },
                    {
                      role: 'worker' as const,
                      emoji: '👷', color: 'border-blue-200 bg-blue-50',
                      title: 'Worker',
                      items: ['Ver pedidos asignados', 'Actualizar estado', 'Ver historial propio', 'Notificaciones del browser', 'Notificar al cliente por link o WhatsApp'],
                    },
                    {
                      role: 'delivery' as const,
                      emoji: '🚚', color: 'border-amber-200 bg-amber-50',
                      title: 'Delivery',
                      items: ['Ver pedidos completados', 'Marcar como pagado', 'Marcar como entregado', 'Ver historial de entregas'],
                    },
                  ].map((r) => (
                    <div key={r.role} className={`border rounded-xl p-4 ${r.color}`}>
                      <div className='text-2xl mb-2'>{r.emoji}</div>
                      <h3 className='font-bold text-gray-900 mb-3'>{r.title}</h3>
                      <ul className='space-y-1'>
                        {r.items.map((i) => (
                          <li key={i} className='flex items-start gap-1.5 text-xs text-gray-600'>
                            <CheckCircle className='h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5' />{i}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <InfoBox type='tip'>El administrador puede cambiar el rol de cualquier usuario desde la página de Usuarios.</InfoBox>

                <Divider />

                {/* ── FLUJO ── */}
                <SectionTitle id='flujo' icon={ArrowRight}>Flujo de un pedido</SectionTitle>
                <P>Cada pedido sigue un ciclo de vida con estados bien definidos. Los estados avanzan en orden y cada transición tiene un responsable.</P>

                <div className='relative mb-6'>
                  {[
                    { status: 'pendiente',  quien: 'admin',    desc: 'El pedido fue creado y espera ser asignado a un worker.' },
                    { status: 'en_proceso', quien: 'worker',   desc: 'El worker tomó el pedido y lo está preparando.' },
                    { status: 'completado', quien: 'worker',   desc: 'El pedido está listo para ser retirado o entregado.' },
                    { status: 'pagado',     quien: 'delivery', desc: 'El delivery cobró el pedido al cliente.' },
                    { status: 'entregado',  quien: 'delivery', desc: 'El pedido fue entregado físicamente. Ciclo completo.' },
                    { status: 'cancelado',  quien: 'admin',    desc: 'El pedido fue cancelado por el administrador.' },
                  ].map((step, i) => (
                    <div key={step.status} className='flex gap-4 mb-4'>
                      <div className='flex flex-col items-center'>
                        <div className='w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0'>{i + 1}</div>
                        {i < 5 && <div className='w-px h-full bg-gray-200 mt-1' />}
                      </div>
                      <div className='pb-4 flex-1'>
                        <div className='flex items-center gap-2 mb-1 flex-wrap'>
                          <StatusPill status={step.status} />
                          <RoleTag role={step.quien as 'admin' | 'worker' | 'delivery'} />
                        </div>
                        <p className='text-xs text-gray-500'>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <InfoBox type='warn'>
                  Los pedidos <strong>vencidos</strong> son aquellos cuya fecha de entrega ya pasó y aún no están completados, pagados ni entregados. Aparecen marcados en naranja en la lista de pedidos.
                </InfoBox>

                <Divider />

                {/* ── ADMIN DASH ── */}
                <SectionTitle id='admin-dash' icon={Hash}>Dashboard del Administrador</SectionTitle>
                <P>La página principal del administrador muestra un resumen del estado actual del negocio al entrar al sistema.</P>

                <SubTitle>Métricas del día</SubTitle>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4'>
                  {[
                    { label: 'Pedidos hoy',      color: 'text-red-600',     bg: 'bg-red-50',     desc: 'Pedidos creados en el día de hoy.' },
                    { label: 'Ingresos del día', color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Suma de pedidos completados/pagados/entregados hoy.' },
                    { label: 'Pendientes',       color: 'text-amber-600',   bg: 'bg-amber-50',   desc: 'Pedidos sin asignar en este momento.' },
                    { label: 'Workers activos',  color: 'text-blue-600',    bg: 'bg-blue-50',    desc: 'Workers con al menos un pedido en proceso.' },
                  ].map((m) => (
                    <div key={m.label} className={`${m.bg} rounded-xl p-3`}>
                      <p className={`text-lg font-bold ${m.color}`}>—</p>
                      <p className='text-xs font-semibold text-gray-700'>{m.label}</p>
                      <p className='text-xs text-gray-400 mt-1 leading-snug'>{m.desc}</p>
                    </div>
                  ))}
                </div>

                <SubTitle>Pedidos recientes pendientes</SubTitle>
                <P>Los 5 últimos pedidos en estado <StatusPill status='pendiente' /> aparecen listados con un acceso rápido para asignarlos. El botón "Ver todos" lleva a la lista completa.</P>

                <SubTitle>Top 3 workers del día</SubTitle>
                <P>Un resumen del ranking del día con los tres workers con más pedidos completados hoy. Hacer click en cualquiera lleva al detalle del worker.</P>

                <Divider />

                {/* ── CREAR PEDIDO ── */}
                <SectionTitle id='crear-pedido' icon={Plus}>Crear pedido</SectionTitle>
                <P>Solo los administradores pueden crear pedidos. Se accede desde <strong>Gestión → Crear Pedido</strong> en el navbar.</P>

                <SubTitle>Datos del cliente</SubTitle>
                <StepList steps={[
                  { title: 'Nombre del cliente', desc: 'Campo obligatorio con búsqueda inteligente. Al escribir aparecen sugerencias de clientes existentes. Si el cliente ya existe, se pueden autocompletar sus datos. Si es nuevo, se creará automáticamente al guardar el pedido.' },
                  { title: 'Teléfono', desc: 'Opcional. Número de contacto del cliente.' },
                  { title: 'Dirección de entrega', desc: 'Campo con autocompletado. Escribí al menos 4 caracteres y aparecerán sugerencias de calles de Florida, Uruguay. Hacé click en una sugerencia para completarla.' },
                ]} />

                <SubTitle>Productos</SubTitle>
                <P>Agregá los productos del pedido uno por uno. Para cada producto ingresá nombre, cantidad y precio unitario. El sistema calcula el total automáticamente. Podés agregar tantos productos como necesites.</P>
                <InfoBox type='warn'>El pedido no puede guardarse sin al menos un producto.</InfoBox>

                <SubTitle>Detalles del pedido</SubTitle>
                <StepList steps={[
                  { title: 'Fecha de entrega', desc: 'Cuándo debe estar listo el pedido. Por defecto se pone el día de hoy.' },
                  { title: 'Método de pago', desc: 'Efectivo, Débito, Tarjeta de Crédito, Dólares, Cheque o Transferencia.' },
                  { title: '¿Ya está pagado?', desc: 'Tildá esta opción si el cliente ya abonó al momento de crear el pedido.' },
                  { title: 'Notas adicionales', desc: 'Cualquier indicación especial para el worker o el delivery.' },
                ]} />

                <SubTitle>Boleta con RUT</SubTitle>
                <P>Si el cliente requiere boleta fiscal, tildá la opción <strong>"¿Requiere boleta con RUT?"</strong>. Aparecerá un campo para ingresar el RUT del cliente (ej: 21.234.567-8).</P>
                <InfoBox type='tip'>Si seleccionás un cliente existente que ya tiene RUT guardado, el sistema activa automáticamente la casilla de boleta y completa el campo con el RUT almacenado.</InfoBox>

                <SubTitle>Modo ingreso</SubTitle>
                <P>El toggle <strong>"Es ingreso"</strong> en el encabezado de Detalles del Pedido permite registrar un pedido como ingreso interno (por ejemplo, reposición de stock). Cuando está activo:</P>
                <ul className='text-sm text-gray-600 space-y-1 mb-4 ml-4 list-disc'>
                  <li>Los campos de método de pago y "¿Ya está pagado?" se ocultan</li>
                  <li>Se muestra un banner naranja indicando que es modo ingreso</li>
                  <li>El pedido se crea normalmente pero sin datos de pago</li>
                </ul>

                <Divider />

                {/* ── IA PRODUCTOS ── */}
                <SectionTitle id='ia-productos' icon={Sparkles}>Ingreso de productos con IA</SectionTitle>
                <P>Al crear o editar un pedido, el panel de productos tiene tres modos de carga. Podés elegir el que más se adapte a cada situación.</P>

                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5'>
                  <div className='border border-gray-200 rounded-xl p-4'>
                    <div className='flex items-center gap-2 mb-2'>
                      <div className='p-1.5 bg-gray-100 rounded-lg'><Keyboard className='h-4 w-4 text-gray-600' /></div>
                      <span className='text-sm font-semibold text-gray-800'>Manual</span>
                    </div>
                    <p className='text-xs text-gray-500 leading-relaxed'>Ingresás cada producto a mano: nombre, cantidad y precio. Ideal cuando el pedido es corto o ya viene en un formato exacto.</p>
                  </div>
                  <div className='border border-blue-200 bg-blue-50 rounded-xl p-4'>
                    <div className='flex items-center gap-2 mb-2'>
                      <div className='p-1.5 bg-blue-100 rounded-lg'><FileText className='h-4 w-4 text-blue-600' /></div>
                      <span className='text-sm font-semibold text-gray-800'>Texto</span>
                      <span className='text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full'>IA</span>
                    </div>
                    <p className='text-xs text-gray-500 leading-relaxed'>Pegás el mensaje de WhatsApp del cliente tal cual y la IA extrae los productos automáticamente. Entiende cantidades con unidades (2k, 1l, 500g), ítems separados por saltos de línea o comas, y más de un pedido en el mismo texto.</p>
                  </div>
                  <div className='border border-purple-200 bg-purple-50 rounded-xl p-4'>
                    <div className='flex items-center gap-2 mb-2'>
                      <div className='p-1.5 bg-purple-100 rounded-lg'><Camera className='h-4 w-4 text-purple-600' /></div>
                      <span className='text-sm font-semibold text-gray-800'>Imagen</span>
                      <span className='text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded-full'>IA</span>
                    </div>
                    <p className='text-xs text-gray-500 leading-relaxed'>Subís una foto de una lista escrita a mano, un ticket o cualquier imagen con productos y la IA los extrae automáticamente. Soporta JPG, PNG y WEBP hasta 5MB.</p>
                  </div>
                </div>

                <SubTitle>Modo Texto — paso a paso</SubTitle>
                <StepList steps={[
                  { title: 'Cambiá a la pestaña "Texto"', desc: 'Hacé click en el tab "Texto" arriba del panel de productos.' },
                  { title: 'Pegá el mensaje del cliente', desc: 'Copiá el mensaje de WhatsApp y pegalo en el área de texto. No hace falta limpiarlo — la IA ignora saludos, métodos de pago y otros textos que no son productos.' },
                  { title: 'Hacé click en "Analizar con IA"', desc: 'La IA procesa el texto y muestra una vista previa con los productos detectados, sus cantidades y precios (si los había).' },
                  { title: 'Revisá y confirmá', desc: 'Si los productos están bien, hacé click en "Agregar todos". Si algo no coincide, podés descartar y ajustarlo manualmente.' },
                ]} />

                <SubTitle>Modo Imagen — paso a paso</SubTitle>
                <StepList steps={[
                  { title: 'Cambiá a la pestaña "Imagen"', desc: 'Hacé click en el tab "Imagen".' },
                  { title: 'Subí la foto', desc: 'Hacé click en el área de carga o arrastrá la imagen. La IA analiza la imagen automáticamente ni bien se sube.' },
                  { title: 'Esperá el análisis', desc: 'Aparece un indicador de carga. El análisis demora unos segundos.' },
                  { title: 'Revisá y confirmá', desc: 'Igual que en modo Texto — revisá los productos detectados y confirmá para agregarlos al pedido.' },
                ]} />

                <SubTitle>Ejemplos de texto que entiende la IA</SubTitle>
                <div className='bg-gray-900 rounded-xl px-4 py-4 mb-4 overflow-x-auto'>
                  <pre className='text-emerald-300 font-mono text-xs leading-relaxed whitespace-pre'>{`3 f nix cola 2lts / 4 f escudo / 25 leche
6 bio top 3 durazno 3 frutilla
jugo maxi 1lts 2 durazno 2 manzana 2 naranja
2 yerba Baldo de kilo / 3 yerba Baldo de 1/2
1 paquete harina 0000 x5 kilos
6 arvejas (baratas)
4 pasta dental Kolynos 180gms
1/2 salame / 3 paté lengua
2 tallarín 1kg San Ignacio / 3 tallarín de 1/2
En otra boleta
10 wafles surtidos (baratos)`}</pre>
                </div>
                <InfoBox type='tip'>La IA reconoce marcas uruguayas (Puritas, Condesa, Baldo, Canaria, Urca, San Ignacio...), entiende "f" como funda/pack, "de 1/2"/"de kilo" como tamaño, y "/" como separador de ítems. Las notas entre paréntesis como "(baratos)" se mantienen en el nombre para que el worker sepa qué elegir.</InfoBox>

                {/* Disclaimer IA */}
                <div className='mt-6 border border-amber-200 bg-amber-50 rounded-xl p-5'>
                  <div className='flex items-start gap-3'>
                    <div className='p-2 bg-amber-100 rounded-lg flex-shrink-0'>
                      <DollarSign className='h-4 w-4 text-amber-600' />
                    </div>
                    <div>
                      <h3 className='text-sm font-bold text-amber-900 mb-1'>Disclaimer — Uso de IA y costos</h3>
                      <p className='text-xs text-amber-800 leading-relaxed mb-3'>
                        Los modos <strong>Texto</strong> e <strong>Imagen</strong> usan la API de Claude (Anthropic) para analizar el contenido. Esto requiere una <strong>ANTHROPIC_API_KEY</strong> configurada en el servidor y tiene un costo por uso según la cantidad de tokens procesados.
                      </p>
                      <p className='text-xs text-amber-700 font-semibold mb-2'>Estimación de costos para 1.000 pedidos/mes:</p>
                      <div className='grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3'>
                        {[
                          { label: 'Solo texto', usd: '≈ U$S 1,70', detail: '~900 tokens de entrada + ~250 de salida por pedido' },
                          { label: 'Solo imagen', usd: '≈ U$S 3,20', detail: '~2.750 tokens de entrada (imagen) + ~250 de salida por pedido' },
                          { label: 'Mixto (50/50)', usd: '≈ U$S 2,50', detail: 'Combinando texto e imagen en partes iguales' },
                        ].map((c) => (
                          <div key={c.label} className='bg-white rounded-lg p-3 border border-amber-100'>
                            <p className='text-xs font-semibold text-gray-700 mb-1'>{c.label}</p>
                            <p className='text-lg font-bold text-amber-700'>{c.usd}</p>
                            <p className='text-xs text-gray-400 leading-snug mt-1'>{c.detail}</p>
                          </div>
                        ))}
                      </div>
                      <p className='text-xs text-amber-700 leading-relaxed'>
                        Modelo utilizado: <strong>Claude Haiku 4.5</strong> — el más económico de Anthropic (U$S 0,80/millón tokens entrada · U$S 4,00/millón tokens salida). Los precios son estimativos y pueden variar según el largo de los mensajes y las imágenes. El modo <strong>Manual</strong> no tiene ningún costo de IA.
                      </p>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* ── LISTA PEDIDOS ── */}
                <SectionTitle id='admin-pedidos' icon={Package}>Lista de pedidos</SectionTitle>
                <P>Accedé desde <strong>Gestión → Pedidos</strong>. Muestra todos los pedidos del sistema con filtros avanzados, búsqueda y paginación.</P>

                <SubTitle>Estadísticas rápidas</SubTitle>
                <P>En la parte superior hay tarjetas con contadores por estado: Total, En Proceso, Completados, Vencidos. Hacé click en una para filtrar por ese estado.</P>

                <SubTitle>Filtros y búsqueda</SubTitle>
                <FeatureGrid items={[
                  { icon: Search,  title: 'Búsqueda por cliente',  desc: 'Escribí el nombre del cliente para filtrar en tiempo real.' },
                  { icon: Filter,  title: 'Filtro por estado',     desc: 'Seleccioná un estado del dropdown para ver solo esos pedidos.' },
                  { icon: Filter,  title: 'Filtro por método de pago', desc: 'Filtrá por efectivo, transferencia, dólares, etc.' },
                  { icon: RefreshCw, title: 'Tiempo real',         desc: 'La lista se actualiza automáticamente cuando cambia algún pedido.' },
                ]} />

                <SubTitle>Paginación</SubTitle>
                <P>La lista muestra 6 pedidos por página en grilla. Usá los botones de navegación (anterior / siguiente) o los números de página para moverte.</P>

                <Divider />

                {/* ── DETALLE PEDIDO ── */}
                <SectionTitle id='admin-detalle' icon={Eye}>Detalle de pedido</SectionTitle>
                <P>Al hacer click en cualquier pedido de la lista se abre su página de detalle. Desde aquí el admin puede ver toda la información y realizar acciones sobre el pedido.</P>

                <SubTitle>Información visible</SubTitle>
                <ul className='text-sm text-gray-600 space-y-1 mb-4 ml-3 sm:ml-4 list-disc'>
                  <li>Nombre del cliente, teléfono y dirección (con botón "Ver en mapa")</li>
                  <li>Lista de productos con cantidad, precio unitario y total</li>
                  <li>Monto total del pedido</li>
                  <li>Método de pago y si está pagado</li>
                  <li>Fecha de entrega y estado de vencimiento</li>
                  <li>Notas adicionales</li>
                  <li>Indicador de boleta/RUT si aplica</li>
                  <li>Worker asignado y fecha de asignación</li>
                  <li>Historial de estados (auditoría)</li>
                </ul>

                <SubTitle>Acciones disponibles</SubTitle>
                <FeatureGrid items={[
                  { icon: Edit,           title: 'Editar pedido',          desc: 'Modificar cualquier campo del pedido incluyendo productos y dirección.' },
                  { icon: Users,          title: 'Asignar worker',         desc: 'Seleccionar qué worker procesará el pedido.' },
                  { icon: CheckCircle,    title: 'Cambiar estado',         desc: 'Mover el pedido a cualquier estado manualmente.' },
                  { icon: Link2,          title: 'Copiar link de seguimiento', desc: 'Copia al portapapeles el link público para que el cliente vea el progreso de su pedido.' },
                  { icon: MessageCircle,  title: 'Enviar por WhatsApp',    desc: 'Abre WhatsApp con el teléfono del cliente y un mensaje con el link de seguimiento prellenado.' },
                  { icon: Trash2,         title: 'Cancelar pedido',        desc: 'Se pide confirmación antes de cancelar. La acción es irreversible.' },
                ]} />
                <InfoBox type='tip'>Los botones de "Link" y "WhatsApp" aparecen en el encabezado del detalle del pedido, junto al botón de PDF y el de editar.</InfoBox>
                <InfoBox type='warn'>Al cambiar el estado a <strong>Cancelado</strong> el sistema pedirá confirmación. Una vez cancelado, el pedido no puede retomarse.</InfoBox>

                <Divider />

                {/* ── CLIENTES ── */}
                <SectionTitle id='clientes' icon={UserRound}>Clientes</SectionTitle>
                <P>Accedé desde <strong>Gestión → Clientes</strong>. El sistema registra automáticamente a los clientes cuando se crean pedidos y permite gestionar su información.</P>

                <SubTitle>Creación automática</SubTitle>
                <P>Cada vez que se crea un pedido, el sistema guarda o actualiza automáticamente al cliente en segundo plano. Si ya existe un cliente con ese nombre (sin distinguir mayúsculas), se actualiza su información; si no existe, se crea uno nuevo.</P>
                <InfoBox type='tip'>El cliente se crea aunque el proceso de creación del pedido sea muy rápido — la sincronización es asíncrona y no bloquea el guardado del pedido.</InfoBox>

                <SubTitle>Datos que se guardan</SubTitle>
                <FeatureGrid items={[
                  { icon: UserRound,  title: 'Nombre',    desc: 'Nombre completo del cliente. Es la clave de identificación.' },
                  { icon: Bell,       title: 'Teléfono',  desc: 'Número de contacto. Se actualiza si se ingresa uno nuevo.' },
                  { icon: MapPin,     title: 'Dirección', desc: 'Última dirección de entrega registrada.' },
                  { icon: FileText,   title: 'RUT',       desc: 'RUT fiscal del cliente. Se guarda cuando se usa la opción de boleta.' },
                ]} />

                <SubTitle>Búsqueda inteligente al crear pedidos</SubTitle>
                <P>Al escribir el nombre del cliente en el formulario de crear pedido, aparece un dropdown con sugerencias de clientes existentes. Al seleccionar uno:</P>
                <ul className='text-sm text-gray-600 space-y-1 mb-4 ml-4 list-disc'>
                  <li>Se completa automáticamente el teléfono (si tiene)</li>
                  <li>Se completa automáticamente la dirección (si tiene)</li>
                  <li>Si el cliente tiene RUT guardado, se activa la casilla de boleta y se completa el RUT</li>
                </ul>

                <SubTitle>Editar clientes</SubTitle>
                <P>En la página de Clientes podés editar nombre, teléfono, dirección y RUT de cualquier cliente directamente en la tabla. Hacé click en <strong>Editar</strong> para activar la fila editable y guardá los cambios.</P>

                <SubTitle>Estadísticas</SubTitle>
                <P>La página muestra tarjetas con: total de clientes, cuántos tienen teléfono, cuántos tienen dirección y cuántos tienen RUT guardado. La tabla incluye el conteo de pedidos por cliente y la fecha del último pedido.</P>

                <Divider />

                {/* ── RANKING ── */}
                <SectionTitle id='ranking' icon={Trophy}>Ranking de workers</SectionTitle>
                <P>Accedé desde <strong>Gestión → Ranking</strong>. Muestra el rendimiento de todos los workers ordenados por puntuación.</P>

                <SubTitle>Fórmula de puntuación</SubTitle>
                <div className='bg-gray-900 rounded-xl px-4 py-4 mb-4 overflow-x-auto'>
                  <p className='text-emerald-400 font-mono text-xs sm:text-sm text-center whitespace-nowrap'>Score = Completados × 10.000 − (Tiempo promedio en minutos)</p>
                </div>
                <P>El volumen manda: completar más pedidos siempre suma más. El tiempo promedio actúa como desempate — entre dos workers con la misma cantidad, gana el más rápido.</P>

                <SubTitle>Filtros de período</SubTitle>
                <P>Los botones de período recalculan el ranking considerando solo los pedidos completados en ese rango:</P>
                <div className='flex flex-wrap gap-2 mb-4'>
                  {['Hoy', 'Esta semana', 'Este mes', 'Todo'].map((p) => (
                    <span key={p} className='px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-700'>{p}</span>
                  ))}
                </div>

                <SubTitle>Podio y lista completa</SubTitle>
                <P>Los tres primeros aparecen en un podio visual con medallas 🥇🥈🥉. Debajo hay una lista completa con barra de score proporcional al líder, estadísticas de hoy, en proceso y tiempo promedio.</P>

                <SubTitle>Detalle por worker</SubTitle>
                <P>Al hacer click en cualquier worker (en el podio o en la lista), se abre su página de detalle con:</P>
                <ul className='text-sm text-gray-600 space-y-1 mb-4 ml-4 list-disc'>
                  <li>Cards resumen: completados, completados hoy, en proceso, tiempo promedio y mejor tiempo</li>
                  <li>Lista completa de todos sus pedidos con fecha de asignación, fecha de finalización y duración exacta</li>
                  <li>Cada pedido es un link al detalle del pedido</li>
                </ul>
                <InfoBox type='tip'>El ranking se actualiza automáticamente cuando cualquier pedido cambia de estado, además del refresco automático cada 30 segundos.</InfoBox>

                <Divider />

                {/* ── REPORTES ── */}
                <SectionTitle id='reportes' icon={BarChart3}>Reportes</SectionTitle>
                <P>Accedé desde <strong>Gestión → Reportes</strong>. Muestra gráficos y estadísticas del negocio.</P>

                <SubTitle>Gráfico de pedidos por día</SubTitle>
                <P>Barras que muestran los últimos 14 días con el total de pedidos creados (gris) y los completados (verde). Pasando el mouse sobre cada barra se ve el detalle del día.</P>

                <SubTitle>Distribución por estado</SubTitle>
                <P>Gráfico de torta (gradiente cónico) mostrando qué porcentaje del total corresponde a cada estado. La leyenda muestra el color, estado y cantidad exacta.</P>

                <SubTitle>Exportar PDF</SubTitle>
                <P>El botón de descarga genera un PDF del reporte con todos los datos del período seleccionado, listo para imprimir o compartir.</P>

                <Divider />

                {/* ── USUARIOS ── */}
                <SectionTitle id='usuarios' icon={Users}>Usuarios</SectionTitle>
                <P>Accedé desde <strong>Gestión → Usuarios</strong>. Solo los administradores pueden gestionar usuarios.</P>

                <SubTitle>Lista de usuarios</SubTitle>
                <P>Muestra todos los usuarios registrados con nombre, email, rol y fecha de registro. Se pueden buscar y filtrar por rol.</P>

                <SubTitle>Cambiar rol</SubTitle>
                <StepList steps={[
                  { title: 'Encontrá al usuario', desc: 'Buscalo por nombre o email, o filtrá por rol.' },
                  { title: 'Hacé click en el rol', desc: 'Aparece un selector de rol (Admin / Worker / Delivery).' },
                  { title: 'Confirmá el cambio', desc: 'El usuario verá el nuevo rol la próxima vez que recargue la página.' },
                ]} />
                <InfoBox type='warn'>Cambiar el rol de un usuario cambia inmediatamente qué páginas puede ver y qué acciones puede realizar.</InfoBox>

                <SubTitle>Editar perfil (nombre y teléfono)</SubTitle>
                <P>Para workers y delivery, el admin puede editar el nombre y el número de teléfono directamente desde la tabla de usuarios.</P>
                <StepList steps={[
                  { title: 'Hacé click en "Editar"', desc: 'El botón aparece en cada fila de la tabla de usuarios.' },
                  { title: 'Modificá nombre y/o teléfono', desc: 'Ingresá el nuevo nombre o el número de contacto (ej: 099 123 456).' },
                  { title: 'Guardá los cambios', desc: 'El perfil se actualiza al instante para ese usuario.' },
                ]} />

                <SubTitle>Teléfono como link de WhatsApp</SubTitle>
                <P>Cuando un worker o delivery tiene teléfono cargado, el número aparece en la tabla como un link que abre su chat de WhatsApp directamente. En el celular abre la app de WhatsApp; en la computadora abre WhatsApp Web.</P>
                <InfoBox type='tip'>El sistema normaliza automáticamente el formato uruguayo: si el número empieza con <strong>0</strong> (ej: 099...), lo convierte al formato internacional <strong>598 99...</strong> para que el link de WhatsApp funcione correctamente.</InfoBox>

                <Divider />
              </>
            )}

            {/* ── TRACKING ── (admin only) */}
            {role === 'admin' && (
              <>
                <SectionTitle id='tracking' icon={Link2}>Link de seguimiento del cliente</SectionTitle>
                <P>Cada pedido tiene una URL pública única en <strong>/track/[id]</strong> que el cliente puede abrir sin necesidad de iniciar sesión. Desde ahí ve el progreso de su pedido en tiempo real.</P>

                <SubTitle>¿Qué ve el cliente?</SubTitle>
                <ul className='text-sm text-gray-600 space-y-1 mb-4 ml-4 list-disc'>
                  <li>Un stepper de 4 pasos: <strong>Recibido → En preparación → Listo → Entregado</strong></li>
                  <li>Lista de productos del pedido con íconos de estado (completado / faltante / pendiente)</li>
                  <li>Nombre del worker que está preparando el pedido (cuando está en proceso)</li>
                  <li>Barra de progreso de los productos cuando el pedido está en preparación</li>
                  <li>Actualizaciones en tiempo real sin necesidad de recargar la página</li>
                </ul>

                <SubTitle>Cómo compartir el link</SubTitle>
                <P>Desde el detalle de cualquier pedido, en el encabezado, hay dos botones:</P>
                <FeatureGrid items={[
                  { icon: Link2,         title: 'Copiar link',     desc: 'Copia la URL de seguimiento al portapapeles con un click. Podés pegarlo donde quieras.' },
                  { icon: MessageCircle, title: 'Enviar WhatsApp', desc: 'Si el pedido tiene teléfono del cliente, abre WhatsApp con el mensaje y el link prellenados. Si no tiene teléfono, abre WhatsApp igualmente para elegir el contacto.' },
                ]} />
                <InfoBox type='tip'>El link es permanente — el cliente puede guardarlo y volver a consultarlo cuando quiera mientras el pedido esté activo.</InfoBox>

                <Divider />

                {/* ── DEMO ── */}
                <SectionTitle id='demo' icon={ExternalLink}>Demo pública — Formulario de pedidos</SectionTitle>
                <P>La ruta <strong>/demo</strong> es un formulario público donde cualquier persona puede hacer un pedido sin necesidad de iniciar sesión ni tener una cuenta. Ideal para compartir a clientes nuevos.</P>

                <SubTitle>¿Qué puede hacer el cliente en la demo?</SubTitle>
                <ul className='text-sm text-gray-600 space-y-1 mb-4 ml-4 list-disc'>
                  <li>Ingresar nombre (obligatorio), teléfono y dirección</li>
                  <li>Agregar productos con nombre y cantidad</li>
                  <li>Elegir método de pago: <strong>Efectivo, Débito o Transferencia</strong></li>
                  <li>Agregar notas adicionales</li>
                  <li>Enviar el pedido — se crea automáticamente en el sistema</li>
                  <li>Al enviar, recibe un <strong>link de seguimiento</strong> para ver el progreso</li>
                </ul>

                <SubTitle>Diferencias con el formulario interno</SubTitle>
                <FeatureGrid items={[
                  { icon: Shield,    title: 'Sin login',           desc: 'Cualquiera puede acceder desde el link. No necesita cuenta ni contraseña.' },
                  { icon: ArrowRight, title: 'Sin fecha',          desc: 'No se muestra el picker de fecha — la fecha de entrega se asigna automáticamente al día siguiente.' },
                  { icon: CheckCircle, title: 'Métodos limitados', desc: 'Solo Efectivo, Débito y Transferencia. No se permiten dólares, cheque ni crédito.' },
                  { icon: ExternalLink, title: 'Sin precio',       desc: 'Los productos no tienen campo de precio — el admin los gestiona desde el panel interno.' },
                ]} />

                <SubTitle>Cómo el admin ve estos pedidos</SubTitle>
                <P>Los pedidos creados desde la demo aparecen en la lista normal de pedidos del admin, igual que cualquier otro pedido. Se identifican porque el campo <strong>"Creado por"</strong> está vacío (el pedido no tiene usuario asociado). Desde ahí el admin puede asignarlos a un worker y gestionar el ciclo normal.</P>

                <InfoBox type='tip'>La demo tiene modo claro y oscuro (por defecto claro). El cliente puede cambiar el tema desde el botón en el encabezado de la página.</InfoBox>
                <InfoBox type='warn'>Para que la demo funcione, la base de datos debe tener habilitadas las políticas RLS que permiten inserts anónimos en la tabla <strong>orders</strong>.</InfoBox>

                <Divider />
              </>
            )}

            {/* ── WORKER ── (visible for admin + worker) */}
            {(role === 'admin' || role === 'worker') && (
              <>
                <SectionTitle id='worker' icon={CheckCircle}>Worker — Mis Pedidos</SectionTitle>
                <P>Al iniciar sesión, el worker ve directamente sus pedidos asignados. No tiene acceso a pedidos de otros workers.</P>

                <SubTitle>Pedidos activos</SubTitle>
                <P>Muestra todos los pedidos asignados al worker que aún no están completados. Cada tarjeta tiene:</P>
                <ul className='text-sm text-gray-600 space-y-1 mb-4 ml-4 list-disc'>
                  <li>Nombre del cliente y dirección (con link a Google Maps)</li>
                  <li>Lista de productos a preparar</li>
                  <li>Fecha de entrega y urgencia</li>
                  <li>Botón para cambiar el estado</li>
                </ul>

                <SubTitle>Cambiar estado de un pedido</SubTitle>
                <StepList steps={[
                  { title: 'Abrí el pedido', desc: 'Hacé click en la tarjeta para ver el detalle.' },
                  { title: 'Seleccioná el nuevo estado', desc: 'Usá el selector de estado en el detalle del pedido.' },
                  { title: 'Guardá el cambio', desc: 'El pedido se actualiza y el admin lo ve en tiempo real.' },
                ]} />

                <SubTitle>Notificar al cliente</SubTitle>
                <P>Desde el detalle de cualquier pedido, el worker puede compartir el link de seguimiento al cliente cuando lo desee — sin depender del admin.</P>
                <FeatureGrid items={[
                  { icon: Link2,         title: 'Copiar link',     desc: 'Copia la URL de seguimiento al portapapeles. Podés pegarlo en WhatsApp, SMS o donde quieras.' },
                  { icon: MessageCircle, title: 'WhatsApp',        desc: 'Si el pedido tiene teléfono del cliente, abre WhatsApp con el mensaje y el link prellenados. Si no tiene teléfono, abre WhatsApp para elegir el contacto.' },
                ]} />
                <InfoBox type='tip'>Podés mandar el link en cualquier momento: al tomar el pedido, al completarlo, o cuando el cliente pregunte cómo va.</InfoBox>

                <SubTitle>Mi Historial</SubTitle>
                <P>Debajo de los pedidos activos hay una sección colapsable <strong>"Mi Historial"</strong> que muestra todos los pedidos que el worker ya procesó, con fecha de finalización y duración. Desde el historial podés hacer click en <strong>"Ver detalle"</strong> para abrir el pedido completo.</P>
                <InfoBox type='tip'>El historial es útil para saber cuántos pedidos procesaste en el día o en la semana.</InfoBox>

                <Divider />
              </>
            )}

            {/* ── DELIVERY ── (visible for admin + delivery) */}
            {(role === 'admin' || role === 'delivery') && (
              <>
                <SectionTitle id='delivery' icon={Truck}>Delivery</SectionTitle>
                <P>El delivery tiene una vista simplificada con solo los pedidos listos para cobrar y/o entregar.</P>

                <SubTitle>Pedidos disponibles</SubTitle>
                <P>Muestra los pedidos en estado <StatusPill status='completado' /> que están listos para que el delivery los retire y entregue al cliente.</P>

                <SubTitle>Flujo del delivery</SubTitle>
                <StepList steps={[
                  { title: 'Ver el pedido', desc: 'Hacé click para ver la dirección del cliente y el detalle del pedido.' },
                  { title: 'Cobrar al cliente', desc: 'Marcá el pedido como "Pagado" al recibir el pago.' },
                  { title: 'Entregar', desc: 'Marcá el pedido como "Entregado" al dejarlo en el domicilio.' },
                ]} />

                <SubTitle>Historial de entregas</SubTitle>
                <P>El botón del ícono de historial muestra todos los pedidos que el delivery ya procesó (pagado y entregado), con fecha y monto.</P>

                <Divider />
              </>
            )}

            {/* ── CONFIG ── (all roles) */}
            <SectionTitle id='config' icon={Settings}>Configuración</SectionTitle>
            <P>Accedé desde el ícono de engranaje en el navbar. Disponible para todos los roles.</P>

            <SubTitle>Información de la cuenta</SubTitle>
            <P>Muestra tu nombre, email y rol actual con el badge correspondiente (👑 Administrador / 👷 Trabajador / 🚚 Delivery).</P>

            <SubTitle>Tema</SubTitle>
            <P>Podés alternar entre modo claro y modo oscuro. La preferencia se guarda en el navegador y se aplica automáticamente en visitas futuras.</P>

            <SubTitle>Cerrar sesión</SubTitle>
            <P>El botón de cerrar sesión está en el navbar (icono de salida) o en la página de configuración.</P>

            <Divider />

            {/* ── NOTIFICACIONES ── (admin + worker) */}
            {(role === 'admin' || role === 'worker') && (
              <>
                <SectionTitle id='notificaciones' icon={Bell}>Notificaciones del browser</SectionTitle>
                <P>El sistema puede enviar notificaciones nativas del navegador a los workers cuando llega un pedido nuevo mientras la pestaña está en segundo plano.</P>

                <SubTitle>Activar notificaciones</SubTitle>
                <StepList steps={[
                  { title: 'El sistema pide permiso', desc: 'Al entrar a la sección de pedidos por primera vez, el navegador preguntará si querés recibir notificaciones.' },
                  { title: 'Aceptar', desc: 'Hacé click en "Permitir" en el diálogo del navegador.' },
                  { title: 'Listo', desc: 'Recibirás una notificación cada vez que aparezca un nuevo pedido disponible mientras no tenés la pestaña activa.' },
                ]} />
                <InfoBox type='warn'>Si bloqueaste las notificaciones aparecerá un aviso en la pantalla explicando cómo reactivarlas desde la configuración del navegador.</InfoBox>

                <Divider />
              </>
            )}

            {/* ── TIEMPO REAL ── (admin + worker) */}
            {(role === 'admin' || role === 'worker') && (
              <>
                <SectionTitle id='tiempo-real' icon={Zap}>Actualización en tiempo real</SectionTitle>
                <P>Pedidos Patricia usa <strong>Supabase Realtime</strong> para sincronizar cambios entre todos los usuarios sin necesidad de recargar la página.</P>

                <SubTitle>¿Qué se actualiza automáticamente?</SubTitle>
                <ul className='text-sm text-gray-600 space-y-1.5 mb-4 ml-4 list-disc'>
                  <li>La lista de pedidos del administrador cuando cualquier pedido cambia de estado</li>
                  <li>El dashboard del admin cuando se crean o actualizan pedidos</li>
                  <li>El ranking de workers cuando un pedido se completa</li>
                  <li>Los pedidos del delivery cuando alguno pasa a "completado"</li>
                  <li>Los pedidos del worker cuando le asignan uno nuevo</li>
                </ul>

                <SubTitle>Indicador de conexión</SubTitle>
                <P>El punto verde animado en el ranking indica que la conexión en tiempo real está activa. Si hay problemas de conexión, podés usar el botón de actualizar manual.</P>

                <InfoBox type='tip'>El sistema también tiene un refresco automático cada 30 segundos como respaldo, por si la conexión realtime se interrumpe momentáneamente.</InfoBox>

                <Divider />
              </>
            )}

            {/* ── COSTOS, VALOR, PRECIOS ── (admin only) */}
            {role === 'admin' && (
              <>
                <SectionTitle id='costos' icon={DollarSign}>Costos del sistema</SectionTitle>
                <P>El sistema usa dos servicios externos con costos independientes.</P>

                <div className='overflow-x-auto mb-5'>
                  <table className='w-full text-sm border-collapse'>
                    <thead>
                      <tr className='bg-gray-50 border-b border-gray-200'>
                        <th className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Servicio</th>
                        <th className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Función</th>
                        <th className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Gratuito</th>
                        <th className='text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider'>Pago</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                      {[
                        { svc: 'Supabase', fn: 'Base de datos + Auth', free: '$0 — 500 MB DB, 50 MB storage, 50.000 usuarios', paid: '$25 USD/mes — Pro (8 GB DB, backups diarios, SLA)' },
                        { svc: 'Anthropic Claude', fn: 'IA para parsear pedidos', free: 'Sin free tier — pay-per-use desde el primer token', paid: '~$1,70–$3,20 USD/1.000 pedidos (Haiku 4.5)' },
                      ].map((r) => (
                        <tr key={r.svc} className='hover:bg-gray-50'>
                          <td className='px-4 py-3 font-semibold text-gray-800 text-xs'>{r.svc}</td>
                          <td className='px-4 py-3 text-xs text-gray-500'>{r.fn}</td>
                          <td className='px-4 py-3 text-xs text-emerald-700'>{r.free}</td>
                          <td className='px-4 py-3 text-xs text-blue-700'>{r.paid}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <SubTitle>Escenarios de costo mensual</SubTitle>
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4'>
                  {[
                    {
                      label: 'Mínimo',
                      total: '≈ U$S 2–3',
                      color: 'border-emerald-200 bg-emerald-50',
                      badge: 'bg-emerald-100 text-emerald-700',
                      items: ['Supabase Free (gratis)', 'IA: ~$2–3 (1.000 pedidos/mes)'],
                      note: 'Apto para empezar sin costo fijo',
                    },
                    {
                      label: 'Recomendado',
                      total: '≈ U$S 2–5',
                      color: 'border-blue-200 bg-blue-50',
                      badge: 'bg-blue-100 text-blue-700',
                      items: ['Supabase Free (gratis)', 'IA: ~$2–5/mes'],
                      note: 'Uso diario normal, sin sorpresas',
                    },
                    {
                      label: 'Escalado',
                      total: '≈ U$S 28–30',
                      color: 'border-purple-200 bg-purple-50',
                      badge: 'bg-purple-100 text-purple-700',
                      items: ['Supabase Pro: $25/mes', 'IA: ~$3–5/mes (>2.000 pedidos)'],
                      note: 'Backups diarios, DB 8 GB, SLA garantizado',
                    },
                  ].map((s) => (
                    <div key={s.label} className={`border rounded-xl p-4 ${s.color}`}>
                      <div className='flex items-center justify-between mb-2'>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>{s.label}</span>
                        <span className='text-lg font-bold text-gray-900'>{s.total}</span>
                      </div>
                      <ul className='space-y-1 mb-2'>
                        {s.items.map((i) => (
                          <li key={i} className='flex items-start gap-1.5 text-xs text-gray-600'>
                            <CheckCircle className='h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5' />{i}
                          </li>
                        ))}
                      </ul>
                      <p className='text-xs text-gray-400 italic'>{s.note}</p>
                    </div>
                  ))}
                </div>
                <InfoBox type='tip'>El modo Manual de productos no consume IA. Si los clientes mandan mensajes de texto estandarizados podés usar IA solo cuando sea necesario y reducir el costo a centavos por mes.</InfoBox>

                <Divider />

                {/* ── VALOR ── */}
                <SectionTitle id='valor' icon={Zap}>¿Por qué vale la pena?</SectionTitle>
                <P>Razones concretas para mostrarle a un cliente por qué su negocio mejora con esta app.</P>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6'>
                  <div className='border border-red-200 bg-red-50 rounded-xl p-4'>
                    <p className='text-xs font-bold text-red-700 uppercase tracking-wider mb-3'>Sin la app — hoy</p>
                    <ul className='space-y-2'>
                      {[
                        'Pedidos por WhatsApp, papel o Excel — se mezclan y se pierden',
                        'No sabés en qué estado está un pedido sin llamar a alguien',
                        'Los workers no saben cuál es su prioridad',
                        'El delivery sale sin saber si el cliente ya pagó',
                        'No hay registro histórico — si se pierde el cuaderno, se pierde todo',
                        'Errores al copiar manualmente listas largas de productos',
                      ].map((i) => (
                        <li key={i} className='flex items-start gap-2 text-xs text-red-800'>
                          <span className='mt-0.5 text-red-400 flex-shrink-0'>✕</span>{i}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className='border border-emerald-200 bg-emerald-50 rounded-xl p-4'>
                    <p className='text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3'>Con la app</p>
                    <ul className='space-y-2'>
                      {[
                        'Todos los pedidos en un solo lugar, accesibles desde el celular',
                        'Estado visible en tiempo real para admin, workers y delivery',
                        'Cada worker solo ve sus pedidos asignados',
                        'El delivery sabe exactamente qué cobrar y qué entregar',
                        'Historial completo con fecha, hora y quién hizo cada cambio',
                        'IA carga los productos desde un mensaje de WhatsApp en segundos',
                        'El cliente recibe un link para ver el progreso de su pedido en tiempo real',
                        'Formulario público para que los clientes hagan pedidos directamente',
                      ].map((i) => (
                        <li key={i} className='flex items-start gap-2 text-xs text-emerald-800'>
                          <CheckCircle className='h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5' />{i}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6'>
                  {[
                    {
                      icon: Zap,
                      title: 'Ahorra tiempo real',
                      body: 'Cargar un pedido de 15 productos con IA tarda menos de 10 segundos. A mano, 2–3 minutos. Con 30 pedidos diarios son casi 2 horas ahorradas por día.',
                      color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200',
                    },
                    {
                      icon: Shield,
                      title: 'Cero errores de comunicación',
                      body: 'El worker ve la dirección, los productos y las notas exactas. No hay teléfono roto ni malentendidos entre el que toma el pedido y el que lo arma.',
                      color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200',
                    },
                    {
                      icon: BarChart3,
                      title: 'Visibilidad del negocio',
                      body: 'Reportes diarios, semanales y mensuales. El admin sabe cuánto facturó, cuántos pedidos completó y qué workers rinden más — sin contar nada a mano.',
                      color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200',
                    },
                    {
                      icon: Trophy,
                      title: 'Trabajadores más motivados',
                      body: 'El ranking gamifica el trabajo. Los workers compiten entre ellos, mejoran su velocidad y el negocio gana sin que el dueño tenga que estar encima.',
                      color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200',
                    },
                    {
                      icon: MapPin,
                      title: 'Control del delivery',
                      body: 'El delivery sabe exactamente qué pedidos tiene, a qué dirección ir, y si ya está pagado. Menos llamadas, menos confusión, menos pedidos entregados sin cobrar.',
                      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',
                    },
                    {
                      icon: RefreshCw,
                      title: 'Escala con el negocio',
                      body: 'Funciona igual con 5 pedidos por día que con 200. Se agregan workers, se ajustan roles, y todo sigue funcionando sin cambiar nada.',
                      color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200',
                    },
                  ].map((c) => (
                    <div key={c.title} className={`border rounded-xl p-4 ${c.bg} ${c.border}`}>
                      <div className='flex items-center gap-2 mb-2'>
                        <c.icon className={`h-4 w-4 flex-shrink-0 ${c.color}`} />
                        <span className='text-sm font-semibold text-gray-800'>{c.title}</span>
                      </div>
                      <p className='text-xs text-gray-600 leading-relaxed'>{c.body}</p>
                    </div>
                  ))}
                </div>

                <SubTitle>Comparativa con otras opciones</SubTitle>
                <div className='overflow-x-auto mb-5'>
                  <table className='w-full text-xs border-collapse'>
                    <thead>
                      <tr className='bg-gray-50 border-b border-gray-200'>
                        <th className='text-left px-3 py-2.5 font-semibold text-gray-500'></th>
                        <th className='text-center px-3 py-2.5 font-semibold text-gray-500'>WhatsApp + papel</th>
                        <th className='text-center px-3 py-2.5 font-semibold text-gray-500'>Excel / Google Sheets</th>
                        <th className='text-center px-3 py-2.5 font-semibold bg-red-50 text-red-700'>Esta app</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                      {[
                        ['Roles y permisos por usuario', '✕', '✕', '✓'],
                        ['Estado en tiempo real', '✕', '✕', '✓'],
                        ['IA para cargar productos', '✕', '✕', '✓'],
                        ['Gestión de clientes con RUT', '✕', 'Manual', '✓'],
                        ['Historial con auditoría', '✕', 'Parcial', '✓'],
                        ['Ranking y métricas de workers', '✕', 'Manual', '✓'],
                        ['Notificaciones al worker', '✕', '✕', '✓'],
                        ['Link de seguimiento al cliente', '✕', '✕', '✓'],
                        ['Formulario público para clientes', '✕', '✕', '✓'],
                        ['Acceso desde celular', '✓', 'Parcial', '✓'],
                        ['Reportes automáticos', '✕', 'Manual', '✓'],
                        ['Personalización de marca', '—', '—', '✓ (Pro)'],
                      ].map(([feat, ...vals]) => (
                        <tr key={feat} className='hover:bg-gray-50'>
                          <td className='px-3 py-2 text-gray-700 font-medium'>{feat}</td>
                          {vals.map((v, i) => (
                            <td key={i} className={`px-3 py-2 text-center font-medium ${v === '✓' ? 'text-emerald-600' : v === '✕' ? 'text-red-400' : 'text-gray-400'} ${i === 2 ? 'bg-red-50' : ''}`}>{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Divider />

                {/* ── PRECIOS ── */}
                <SectionTitle id='precios' icon={Sparkles}>Presentación de precios</SectionTitle>
                <P>Referencia de precios para vender Pedidos Patricia como servicio mensual (SaaS). Cubren la infraestructura y dejan margen. Cotización de referencia: <strong>U$S 1 ≈ $43 UYU</strong>.</P>

                <div className='bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 mb-6 text-white'>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4'>
                    <div>
                      <p className='text-xs text-gray-400 uppercase tracking-wider mb-1'>Pago único · Una sola vez</p>
                      <h3 className='text-base font-bold'>Setup & Configuración inicial</h3>
                      <p className='text-xs text-gray-400 mt-0.5'>Incluye todo para arrancar desde cero</p>
                    </div>
                    <div className='text-right'>
                      <p className='text-3xl font-black text-white'>U$S 200</p>
                      <p className='text-sm font-semibold text-emerald-400'>≈ $8.600 UYU</p>
                    </div>
                  </div>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-1.5'>
                    {[
                      'Alta de usuarios iniciales (admin, workers, delivery)',
                      'Capacitación presencial o videollamada (1 hora)',
                      'Manual de usuario personalizado incluido',
                    ].map((i) => (
                      <div key={i} className='flex items-start gap-2 text-xs text-gray-300'>
                        <CheckCircle className='h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5' />{i}
                      </div>
                    ))}
                  </div>
                </div>

                <div className='border-2 border-blue-400 rounded-2xl overflow-hidden mb-5 max-w-sm'>
                  <div className='px-6 py-5 bg-blue-600'>
                    <p className='text-2xl mb-1'>🏬</p>
                    <p className='text-sm font-bold text-white'>Plan mensual</p>
                    <div className='flex items-end gap-2 mt-1'>
                      <p className='text-3xl font-black text-white'>U$S 50</p>
                      <span className='text-blue-100 text-sm mb-0.5'>/mes</span>
                    </div>
                    <p className='text-sm font-semibold text-emerald-300'>≈ $2.150 UYU<span className='text-blue-100 text-xs font-normal ml-1'>/mes</span></p>
                    <p className='text-xs text-blue-100 mt-1.5'>Pedidos y usuarios ilimitados</p>
                  </div>
                  <div className='px-6 py-5 bg-white'>
                    <ul className='space-y-2'>
                      {[
                        'Gestión completa de pedidos',
                        'Roles: admin, worker, delivery',
                        'IA para texto e imagen',
                        'Ranking de workers',
                        'Reportes + exportar PDF',
                        'Tiempo real',
                        'Link de seguimiento al cliente',
                        'Demo pública para clientes',
                        'Personalización de marca',
                        'Actualizaciones incluidas',
                      ].map((f) => (
                        <li key={f} className='flex items-center gap-2 text-xs text-gray-700'>
                          <CheckCircle className='h-3.5 w-3.5 text-emerald-500 flex-shrink-0' />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <InfoBox type='info'>
                  Los precios en pesos varían con el dólar. Se recomienda cobrar en <strong>dólares</strong> o actualizar la lista cada vez que el tipo de cambio varíe más de $2 UYU. La cotización usada aquí es <strong>U$S 1 = $43 UYU</strong> (marzo 2025).
                </InfoBox>
              </>
            )}

            {/* Footer */}
            <div className='mt-12 pt-6 border-t border-gray-100 text-center'>
              <p className='text-xs text-gray-400'>Pedidos Patricia · Florida, Uruguay · 2025</p>
            </div>

          </main>
        </div>
      </div>
    </MainLayout>
  )
}

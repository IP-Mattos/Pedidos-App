'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  BookOpen, ChevronRight, Package, Users, BarChart3, Trophy, Settings,
  Plus, Search, Filter, CheckCircle, Clock, Truck, DollarSign, MapPin,
  Bell, Star, ArrowRight, Hash, Zap, Shield, RefreshCw, Download,
  Eye, Edit, Trash2, ChevronDown, AlertCircle, History, List
} from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'

// ─── Types ───────────────────────────────────────────────────────────────────

type Section = { id: string; label: string; icon: React.ElementType }

// ─── Sidebar sections ────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  { id: 'intro',          label: 'Introducción',         icon: BookOpen },
  { id: 'roles',          label: 'Roles de usuario',     icon: Shield },
  { id: 'flujo',          label: 'Flujo de un pedido',   icon: ArrowRight },
  { id: 'admin-dash',     label: 'Dashboard (Admin)',    icon: Hash },
  { id: 'crear-pedido',   label: 'Crear pedido',         icon: Plus },
  { id: 'admin-pedidos',  label: 'Lista de pedidos',     icon: Package },
  { id: 'admin-detalle',  label: 'Detalle de pedido',    icon: Eye },
  { id: 'ranking',        label: 'Ranking de workers',   icon: Trophy },
  { id: 'reportes',       label: 'Reportes',             icon: BarChart3 },
  { id: 'usuarios',       label: 'Usuarios',             icon: Users },
  { id: 'worker',         label: 'Worker — Pedidos',     icon: CheckCircle },
  { id: 'delivery',       label: 'Delivery',             icon: Truck },
  { id: 'config',         label: 'Configuración',        icon: Settings },
  { id: 'notificaciones', label: 'Notificaciones',       icon: Bell },
  { id: 'tiempo-real',    label: 'Tiempo real',          icon: Zap },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionTitle({ id, icon: Icon, children }: { id: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div id={id} className='flex items-center gap-3 mb-6 pt-2'>
      <div className='p-2 bg-red-100 rounded-lg'>
        <Icon className='h-5 w-5 text-red-600' />
      </div>
      <h2 className='text-2xl font-bold text-gray-900'>{children}</h2>
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
  const [active, setActive] = useState('intro')
  const [mobileOpen, setMobileOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) })
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observerRef.current?.observe(el)
    })
    return () => observerRef.current?.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileOpen(false)
  }

  return (
    <MainLayout>
      <div className='max-w-7xl mx-auto px-4 py-8'>

        {/* Page header */}
        <div className='mb-8'>
          <div className='flex items-center gap-2 text-sm text-gray-400 mb-3'>
            <Link href='/' className='hover:text-gray-600'>Inicio</Link>
            <ChevronRight className='h-3.5 w-3.5' />
            <span className='text-gray-700'>Guía de uso</span>
          </div>
          <h1 className='text-3xl font-bold text-gray-900'>Manual de usuario</h1>
          <p className='text-gray-500 mt-1 text-sm'>Guía completa de todas las funciones de Pedidos Patricia.</p>
        </div>

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
            {SECTIONS.map((s) => (
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
                {SECTIONS.map((s) => (
                  <button key={s.id} onClick={() => scrollTo(s.id)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${active === s.id ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
                    <s.icon className='h-3.5 w-3.5 flex-shrink-0' />{s.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className='flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-8'>

            {/* ── INTRO ── */}
            <SectionTitle id='intro' icon={BookOpen}>Introducción</SectionTitle>
            <P>
              <strong>Pedidos Patricia</strong> es una plataforma web para gestionar pedidos de principio a fin. Centraliza la creación, seguimiento, procesamiento y entrega de pedidos, con visibilidad en tiempo real para cada integrante del equipo.
            </P>
            <P>
              El sistema funciona con tres roles bien definidos: el <strong>Administrador</strong> crea y supervisa todo, los <strong>Workers</strong> procesan los pedidos, y el equipo de <strong>Delivery</strong> gestiona el cobro y la entrega.
            </P>
            <FeatureGrid items={[
              { icon: Zap,      title: 'Tiempo real',      desc: 'Los cambios de estado se reflejan al instante gracias a Supabase Realtime.' },
              { icon: Shield,   title: 'Roles y accesos',  desc: 'Cada usuario solo ve y puede hacer lo que le corresponde.' },
              { icon: MapPin,   title: 'Dirección',        desc: 'Autocompletado de dirección restringido a Florida, Uruguay.' },
              { icon: Bell,     title: 'Notificaciones',   desc: 'Los workers reciben alertas del browser cuando llega un pedido nuevo.' },
            ]} />

            <Divider />

            {/* ── ROLES ── */}
            <SectionTitle id='roles' icon={Shield}>Roles de usuario</SectionTitle>
            <P>Al registrarse, cada cuenta tiene un rol asignado por el administrador. El rol determina qué páginas puede ver y qué acciones puede realizar.</P>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
              {[
                {
                  role: 'admin' as const,
                  emoji: '👑', color: 'border-red-200 bg-red-50',
                  title: 'Administrador',
                  items: ['Dashboard con métricas', 'Crear y editar pedidos', 'Asignar workers', 'Ver todos los pedidos', 'Acciones en lote', 'Ranking de workers', 'Reportes y gráficos', 'Gestión de usuarios'],
                },
                {
                  role: 'worker' as const,
                  emoji: '👷', color: 'border-blue-200 bg-blue-50',
                  title: 'Worker',
                  items: ['Ver pedidos asignados', 'Actualizar estado', 'Ver historial propio', 'Notificaciones del browser'],
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
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4'>
              {[
                { label: 'Pedidos hoy',     color: 'text-red-600',    bg: 'bg-red-50',     desc: 'Pedidos creados en el día de hoy.' },
                { label: 'Ingresos del día', color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Suma de pedidos completados/pagados/entregados hoy.' },
                { label: 'Pendientes',       color: 'text-amber-600',  bg: 'bg-amber-50',   desc: 'Pedidos sin asignar en este momento.' },
                { label: 'Workers activos',  color: 'text-blue-600',   bg: 'bg-blue-50',    desc: 'Workers con al menos un pedido en proceso.' },
              ].map((m) => (
                <div key={m.label} className={`${m.bg} rounded-xl p-3`}>
                  <p className={`text-lg font-bold ${m.color}`}>—</p>
                  <p className='text-xs font-medium text-gray-700'>{m.label}</p>
                  <p className='text-xs text-gray-400 mt-1'>{m.desc}</p>
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
              { title: 'Nombre del cliente', desc: 'Campo obligatorio. Nombre completo de quien hace el pedido.' },
              { title: 'Teléfono', desc: 'Opcional. Número de contacto del cliente.' },
              { title: 'Dirección de entrega', desc: 'Campo con autocompletado. Escribí al menos 4 caracteres y aparecerán sugerencias de calles de Florida, Uruguay. Hacé click en una sugerencia para completarla. El botón "Ver mapa" abre Google Maps para verificar la ubicación.' },
            ]} />

            <SubTitle>Productos</SubTitle>
            <P>Agregá los productos del pedido uno por uno. Para cada producto ingresá nombre, cantidad y precio unitario. El sistema calcula el total automáticamente. Podés agregar tantos productos como necesites.</P>
            <InfoBox type='warn'>El pedido no puede guardarse sin al menos un producto.</InfoBox>

            <SubTitle>Detalles del pedido</SubTitle>
            <StepList steps={[
              { title: 'Fecha de entrega', desc: 'Cuándo debe estar listo el pedido. Por defecto se pone el día de hoy.' },
              { title: 'Método de pago', desc: 'Efectivo, Tarjeta de Crédito, Dólares, Cheque o Transferencia.' },
              { title: '¿Ya está pagado?', desc: 'Tildá esta opción si el cliente ya abonó al momento de crear el pedido.' },
              { title: 'Notas adicionales', desc: 'Cualquier indicación especial para el worker o el delivery.' },
            ]} />

            <Divider />

            {/* ── LISTA PEDIDOS ── */}
            <SectionTitle id='admin-pedidos' icon={Package}>Lista de pedidos</SectionTitle>
            <P>Accedé desde <strong>Gestión → Pedidos</strong>. Muestra todos los pedidos del sistema con filtros avanzados, búsqueda y paginación.</P>

            <SubTitle>Estadísticas rápidas</SubTitle>
            <P>En la parte superior hay tarjetas con contadores por estado: Total, Pendientes, En proceso, Completados, Pagados, Entregados, Vencidos. Hacé click en una para filtrar por ese estado.</P>

            <SubTitle>Filtros y búsqueda</SubTitle>
            <FeatureGrid items={[
              { icon: Search,  title: 'Búsqueda por cliente',  desc: 'Escribí el nombre del cliente para filtrar en tiempo real.' },
              { icon: Filter,  title: 'Filtro por estado',     desc: 'Seleccioná un estado del dropdown para ver solo esos pedidos.' },
              { icon: Filter,  title: 'Filtro por método de pago', desc: 'Filtrá por efectivo, transferencia, dólares, etc.' },
              { icon: RefreshCw, title: 'Tiempo real',         desc: 'La lista se actualiza automáticamente cuando cambia algún pedido.' },
            ]} />

            <SubTitle>Paginación</SubTitle>
            <P>La lista muestra 3 pedidos por página. Usá los botones de navegación (anterior / siguiente) o los números de página para moverte. El contador indica cuántos pedidos hay en total.</P>

            <SubTitle>Acciones en lote (Bulk)</SubTitle>
            <StepList steps={[
              { title: 'Seleccioná pedidos', desc: 'Tildá el checkbox de cada pedido que querés modificar. El checkbox del encabezado selecciona todos los de la página actual.' },
              { title: 'Elegí el nuevo estado', desc: 'Aparece una barra azul en la parte superior con un dropdown de estado.' },
              { title: 'Aplicar', desc: 'Hacé click en "Aplicar" para actualizar todos los pedidos seleccionados de una vez.' },
            ]} />
            <InfoBox type='tip'>Las acciones en lote son útiles para cambiar varios pedidos de estado al mismo tiempo, por ejemplo marcar varios como "entregado" al cierre del día.</InfoBox>

            <Divider />

            {/* ── DETALLE PEDIDO ── */}
            <SectionTitle id='admin-detalle' icon={Eye}>Detalle de pedido</SectionTitle>
            <P>Al hacer click en cualquier pedido de la lista se abre su página de detalle. Desde aquí el admin puede ver toda la información y realizar acciones sobre el pedido.</P>

            <SubTitle>Información visible</SubTitle>
            <ul className='text-sm text-gray-600 space-y-1 mb-4 ml-4 list-disc'>
              <li>Nombre del cliente, teléfono y dirección (con botón "Ver en mapa")</li>
              <li>Lista de productos con cantidad, precio unitario y total</li>
              <li>Monto total del pedido</li>
              <li>Método de pago y si está pagado</li>
              <li>Fecha de entrega y estado de vencimiento</li>
              <li>Notas adicionales</li>
              <li>Worker asignado y fecha de asignación</li>
              <li>Historial de estados (auditoría)</li>
            </ul>

            <SubTitle>Acciones disponibles</SubTitle>
            <FeatureGrid items={[
              { icon: Edit,         title: 'Editar pedido',     desc: 'Modificar cualquier campo del pedido incluyendo productos y dirección.' },
              { icon: Users,        title: 'Asignar worker',    desc: 'Seleccionar qué worker procesará el pedido.' },
              { icon: CheckCircle,  title: 'Cambiar estado',    desc: 'Mover el pedido a cualquier estado manualmente.' },
              { icon: Trash2,       title: 'Cancelar pedido',   desc: 'Se pide confirmación antes de cancelar. La acción es irreversible.' },
            ]} />
            <InfoBox type='warn'>Al cambiar el estado a <strong>Cancelado</strong> el sistema pedirá confirmación. Una vez cancelado, el pedido no puede retomarse.</InfoBox>

            <Divider />

            {/* ── RANKING ── */}
            <SectionTitle id='ranking' icon={Trophy}>Ranking de workers</SectionTitle>
            <P>Accedé desde <strong>Gestión → Ranking</strong>. Muestra el rendimiento de todos los workers ordenados por puntuación.</P>

            <SubTitle>Fórmula de puntuación</SubTitle>
            <div className='bg-gray-900 rounded-xl px-5 py-4 mb-4'>
              <p className='text-emerald-400 font-mono text-sm text-center'>Score = Completados × 10.000 − (Tiempo promedio en minutos)</p>
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

            <Divider />

            {/* ── WORKER ── */}
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

            <SubTitle>Mi Historial</SubTitle>
            <P>Debajo de los pedidos activos hay una sección colapsable <strong>"Mi Historial"</strong> que muestra todos los pedidos que el worker ya procesó, con fecha de finalización y duración.</P>
            <InfoBox type='tip'>El historial es útil para saber cuántos pedidos procesaste en el día o en la semana.</InfoBox>

            <Divider />

            {/* ── DELIVERY ── */}
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

            {/* ── CONFIG ── */}
            <SectionTitle id='config' icon={Settings}>Configuración</SectionTitle>
            <P>Accedé desde el ícono de engranaje en el navbar. Disponible para todos los roles.</P>

            <SubTitle>Información de la cuenta</SubTitle>
            <P>Muestra tu nombre, email y rol actual con el badge correspondiente (👑 Administrador / 👷 Trabajador / 🚚 Delivery).</P>

            <SubTitle>Tema</SubTitle>
            <P>Podés alternar entre modo claro y modo oscuro. La preferencia se guarda en el navegador y se aplica automáticamente en visitas futuras.</P>

            <SubTitle>Cerrar sesión</SubTitle>
            <P>El botón de cerrar sesión está en el navbar (icono de salida) o en la página de configuración.</P>

            <Divider />

            {/* ── NOTIFICACIONES ── */}
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

            {/* ── TIEMPO REAL ── */}
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

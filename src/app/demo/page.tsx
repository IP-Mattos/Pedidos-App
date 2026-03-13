'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import {
  ShoppingCart, Plus, Trash2, CheckCircle2, Copy,
  Package, Loader2, Sun, Moon, Banknote, CreditCard, ArrowLeftRight,
  User, Phone, MapPin, FileText, ChevronUp, ChevronDown
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'

type DemoProduct = { producto: string; cantidad: number }
type MetodoPago = 'efectivo' | 'debito' | 'transferencia'

const METODO_OPTIONS: { value: MetodoPago; label: string; icon: typeof Banknote; color: string }[] = [
  { value: 'efectivo',      label: 'Efectivo',       icon: Banknote,        color: 'text-green-600' },
  { value: 'debito',        label: 'Débito',         icon: CreditCard,      color: 'text-blue-600' },
  { value: 'transferencia', label: 'Transferencia',  icon: ArrowLeftRight,  color: 'text-purple-600' },
]

export default function DemoOrderPage() {
  const [dark, setDark] = useState(false)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [trackingUrl, setTrackingUrl] = useState('')

  // Form fields
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo')
  const [notas, setNotas] = useState('')
  const [productos, setProductos] = useState<DemoProduct[]>([])
  const [newProducto, setNewProducto] = useState('')
  const [newCantidad, setNewCantidad] = useState(1)
  const productoInputRef = useRef<HTMLInputElement>(null)

  // Default: light. Persists preference; syncs html class.
  useEffect(() => {
    const saved = localStorage.getItem('demo-dark')
    const isDark = saved === 'true'   // light if never set
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])
  const toggleDark = () => setDark((d) => {
    const next = !d
    localStorage.setItem('demo-dark', String(next))
    document.documentElement.classList.toggle('dark', next)
    return next
  })

  const addProduct = () => {
    if (!newProducto.trim()) return
    setProductos((prev) => [...prev, { producto: newProducto.trim(), cantidad: newCantidad }])
    setNewProducto('')
    setNewCantidad(1)
    productoInputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addProduct() }
  }

  const removeProduct = (i: number) => setProductos((prev) => prev.filter((_, idx) => idx !== i))

  const changeQty = (i: number, delta: number) =>
    setProductos((prev) => prev.map((p, idx) => idx === i ? { ...p, cantidad: Math.max(1, p.cantidad + delta) } : p))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) { toast.error('Ingresá tu nombre'); return }
    if (productos.length === 0) { toast.error('Agregá al menos un producto'); return }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const fechaEntrega = tomorrow.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('orders')
        .insert({
          nombre_cliente: nombre.trim(),
          customer_phone: telefono.trim() || null,
          customer_address: direccion.trim() || null,
          lista_productos: JSON.stringify(productos.map((p) => ({ ...p, precio: 0 }))),
          fecha_entrega: fechaEntrega,
          esta_pagado: false,
          metodo_pago: metodoPago,
          monto_total: 0,
          status: 'pendiente',
          notas: notas.trim() || null,
          created_by: null,
        })
        .select('id')
        .single()

      if (error) throw new Error(error.message)
      setTrackingUrl(`${window.location.origin}/track/${data.id}`)
      setStep('success')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al enviar el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  const copyLink = () => { navigator.clipboard.writeText(trackingUrl); toast.success('Link copiado') }


  const resetForm = () => {
    setStep('form'); setNombre(''); setTelefono(''); setDireccion('')
    setProductos([]); setNotas(''); setMetodoPago('efectivo')
  }

  // ─── Theme classes ────────────────────────────────────────────────────────────
  const bg    = dark ? 'bg-gray-950'   : 'bg-gray-50'
  const card  = dark ? 'bg-gray-900 border-gray-800'  : 'bg-white border-gray-100'
  const hdr   = dark ? 'bg-gray-900 border-gray-800'  : 'bg-white border-gray-200'
  const txt   = dark ? 'text-gray-100' : 'text-gray-900'
  const sub   = dark ? 'text-gray-400' : 'text-gray-500'
  const lbl   = dark ? 'text-gray-300' : 'text-gray-600'
  const inp   = dark
    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:ring-blue-500'
    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500'
  const chip  = dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
  const empty = dark ? 'border-gray-700 text-gray-600' : 'border-gray-200 text-gray-400'
  const prodRow = dark ? 'bg-gray-800' : 'bg-blue-50'

  // ─── Success screen ───────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center px-4 transition-colors`}>
        <Toaster />
        <div className={`${card} border rounded-2xl shadow-xl max-w-md w-full p-8 text-center`}>
          <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <CheckCircle2 className='h-9 w-9 text-green-500' />
          </div>
          <h1 className={`text-2xl font-bold ${txt}`}>¡Pedido enviado!</h1>
          <p className={`${sub} mt-2 text-sm`}>
            Gracias <span className={`font-semibold ${txt}`}>{nombre}</span>. Tu pedido fue recibido y en breve lo
            empezamos a preparar.
          </p>

          <div className={`mt-5 ${dark ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-4`}>
            <p className={`text-xs ${sub} mb-1.5 font-medium uppercase tracking-wide`}>Seguí tu pedido</p>
            <a href={trackingUrl} target='_blank' rel='noopener noreferrer' className='text-sm text-blue-500 break-all font-mono hover:underline'>{trackingUrl}</a>
          </div>

          <div className='mt-4'>
            <button
              onClick={copyLink}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border ${dark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-700 hover:bg-gray-50'} text-sm font-medium transition-colors`}
            >
              <Copy className='h-4 w-4' /> Copiar link
            </button>
          </div>

          <button onClick={resetForm} className={`mt-5 text-sm ${sub} hover:text-blue-500 transition-colors`}>
            Hacer otro pedido
          </button>
        </div>
      </div>
    )
  }

  // ─── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${bg} transition-colors`}>
      <Toaster />

      {/* Header */}
      <div className={`${hdr} border-b sticky top-0 z-10 backdrop-blur-sm`}>
        <div className='max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm'>
              <ShoppingCart className='h-4 w-4 text-white' />
            </div>
            <div>
              <h1 className={`font-bold ${txt} leading-none text-sm`}>Realizar Pedido</h1>
              <p className={`text-xs ${sub} mt-0.5`}>Completá el formulario</p>
            </div>
          </div>
          <button
            onClick={toggleDark}
            className={`p-2 rounded-xl transition-colors ${dark ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title={dark ? 'Modo claro' : 'Modo oscuro'}
          >
            {dark ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className='max-w-lg mx-auto px-4 py-5 space-y-4 pb-10'>

        {/* ── Datos personales ── */}
        <div className={`${card} border rounded-2xl p-5 space-y-4`}>
          <div className='flex items-center gap-2 mb-1'>
            <User className='h-4 w-4 text-blue-500' />
            <h2 className={`font-semibold ${txt} text-sm`}>Tus datos</h2>
          </div>

          <div>
            <label className={`block text-xs font-medium ${lbl} mb-1.5`}>
              Nombre completo <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder='Juan García'
              autoComplete='name'
              className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${inp}`}
            />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label className={`block text-xs font-medium ${lbl} mb-1.5 flex items-center gap-1`}>
                <Phone className='h-3 w-3' /> Teléfono
              </label>
              <input
                type='tel'
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder='099 123 456'
                autoComplete='tel'
                className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${inp}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium ${lbl} mb-1.5 flex items-center gap-1`}>
                <MapPin className='h-3 w-3' /> Dirección
              </label>
              <input
                type='text'
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder='Calle y número'
                autoComplete='street-address'
                className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${inp}`}
              />
            </div>
          </div>
        </div>

        {/* ── Productos ── */}
        <div className={`${card} border rounded-2xl p-5 space-y-3`}>
          <div className='flex items-center gap-2'>
            <Package className='h-4 w-4 text-blue-500' />
            <h2 className={`font-semibold ${txt} text-sm`}>
              Productos <span className='text-red-500'>*</span>
            </h2>
            {productos.length > 0 && (
              <span className='ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium'>
                {productos.length} ítem{productos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Add row */}
          <div className='flex gap-2'>
            <input
              ref={productoInputRef}
              type='text'
              value={newProducto}
              onChange={(e) => setNewProducto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Ej: Leche entera, Arroz...'
              className={`flex-1 px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm transition-colors ${inp}`}
            />
            <div className={`flex items-center border rounded-xl overflow-hidden ${dark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <button
                type='button'
                onClick={() => setNewCantidad((q) => Math.max(1, q - 1))}
                className={`px-2.5 py-2.5 ${dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-700'} transition-colors`}
              >
                <ChevronDown className='h-3.5 w-3.5' />
              </button>
              <span className={`w-7 text-center text-sm font-semibold ${txt}`}>{newCantidad}</span>
              <button
                type='button'
                onClick={() => setNewCantidad((q) => q + 1)}
                className={`px-2.5 py-2.5 ${dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-700'} transition-colors`}
              >
                <ChevronUp className='h-3.5 w-3.5' />
              </button>
            </div>
            <button
              type='button'
              onClick={addProduct}
              className='px-3.5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex-shrink-0 transition-colors shadow-sm'
            >
              <Plus className='h-4 w-4' />
            </button>
          </div>
          <p className={`text-xs ${sub}`}>Presioná Enter o + para agregar cada producto</p>

          {/* List */}
          {productos.length > 0 ? (
            <div className='space-y-2'>
              {productos.map((p, i) => (
                <div key={i} className={`flex items-center gap-3 ${prodRow} rounded-xl px-3 py-2.5`}>
                  <Package className='h-3.5 w-3.5 text-blue-400 flex-shrink-0' />
                  <span className={`flex-1 text-sm font-medium ${txt} truncate`}>{p.producto}</span>
                  {/* Qty controls inline */}
                  <div className='flex items-center gap-1'>
                    <button type='button' onClick={() => changeQty(i, -1)} className={`${sub} hover:text-blue-500 transition-colors`}>
                      <ChevronDown className='h-3.5 w-3.5' />
                    </button>
                    <span className={`text-xs font-bold ${txt} w-5 text-center`}>{p.cantidad}</span>
                    <button type='button' onClick={() => changeQty(i, 1)} className={`${sub} hover:text-blue-500 transition-colors`}>
                      <ChevronUp className='h-3.5 w-3.5' />
                    </button>
                  </div>
                  <button type='button' onClick={() => removeProduct(i)} className={`${sub} hover:text-red-500 transition-colors ml-1`}>
                    <Trash2 className='h-3.5 w-3.5' />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-6 border-2 border-dashed ${empty} rounded-xl`}>
              <Package className='h-6 w-6 mx-auto mb-2 opacity-40' />
              <p className='text-sm'>Todavía no agregaste productos</p>
            </div>
          )}
        </div>

        {/* ── Método de pago ── */}
        <div className={`${card} border rounded-2xl p-5 space-y-3`}>
          <h2 className={`font-semibold ${txt} text-sm`}>Método de pago</h2>
          <div className='grid grid-cols-3 gap-2.5'>
            {METODO_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const selected = metodoPago === opt.value
              return (
                <button
                  key={opt.value}
                  type='button'
                  onClick={() => setMetodoPago(opt.value)}
                  className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                    selected
                      ? 'border-blue-500 bg-blue-500/10'
                      : dark
                      ? 'border-gray-700 hover:border-gray-600'
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${selected ? 'text-blue-500' : opt.color}`} />
                  <span className={`text-xs font-semibold ${selected ? 'text-blue-600' : txt}`}>{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Notas ── */}
        <div className={`${card} border rounded-2xl p-5`}>
          <label className={`flex items-center gap-2 text-xs font-medium ${lbl} mb-2`}>
            <FileText className='h-3 w-3' /> Notas adicionales <span className={`${sub} font-normal`}>(opcional)</span>
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            placeholder='Aclaraciones, preferencias de entrega...'
            className={`w-full px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 text-sm resize-none transition-colors ${inp}`}
          />
        </div>

        {/* ── Submit ── */}
        <button
          type='submit'
          disabled={submitting || productos.length === 0 || !nombre.trim()}
          className='w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 text-sm'
        >
          {submitting ? (
            <><Loader2 className='h-4 w-4 animate-spin' /> Enviando pedido...</>
          ) : (
            <><ShoppingCart className='h-4 w-4' /> Enviar pedido</>
          )}
        </button>

        <p className={`text-center text-xs ${sub} pb-2`}>
          Recibirás un link para seguir el progreso de tu pedido en tiempo real
        </p>
      </form>
    </div>
  )
}

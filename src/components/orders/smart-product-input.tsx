'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Keyboard, FileText, Camera, Loader2, CheckCircle,
  AlertCircle, Trash2, Edit2, Plus, X, RefreshCw
} from 'lucide-react'
import type { ProductFormData } from '@/lib/validations/orders'
import { ProductList } from './product-list'

// ─── Client-side text parser (fallback when no API key) ──────────────────────

// Lines to skip — greetings, section markers, addresses, etc.
const SKIP_PATTERNS = [
  /^(hola|buen[ao]s?|gracias|saludos|estimad[ao])\b/i,
  /^(pago con|deb[íi]to|cr[eé]dito|efectivo)\b/i,
  /^en otra boleta/i,
  /^\d{4,}$/,           // phone numbers
  /^[+\d\s\-]{8,}$/,   // phone numbers
]

function splitItems(line: string): string[] {
  // Split on "/" only when surrounded by item-like content (not fractions like 2 1/2)
  // A fraction looks like: digit/digit with no spaces
  const parts = line.split(/(?<=\s|^)\s*\/\s*(?=\S)/)
  if (parts.length > 1) return parts.map((p) => p.trim()).filter(Boolean)
  return [line]
}

function parseTextLocally(raw: string): ProductFormData[] {
  // Handle all line ending types (\n, \r\n, \r, Unicode line separators)
  const rawLines = raw.split(/\r?\n|\r|\u2028|\u2029/).map((l) => l.trim()).filter(Boolean)

  // Also split each line on commas — handles comma-separated lists on one line
  const lines: string[] = []
  for (const line of rawLines) {
    const parts = line.split(/,\s*/).map((s) => s.trim()).filter(Boolean)
    lines.push(...parts)
  }

  const results: ProductFormData[] = []

  for (const line of lines) {
    // Skip non-product lines
    if (SKIP_PATTERNS.some((p) => p.test(line))) continue

    // Split items on "/" separator
    const items = splitItems(line)

    for (const item of items) {
      // Remove leading bullets/dashes
      let rest = item.replace(/^[\-\*\•·]+\s*/, '').trim()
      if (!rest) continue

      // Remove trailing punctuation
      rest = rest.replace(/[.,;]+$/, '').trim()

      // Extract precio
      let precio = 0
      const precioMatch = rest.match(/\$\s*(\d+(?:[.,]\d{1,2})?)/)
      if (precioMatch) {
        precio = parseFloat(precioMatch[1].replace(',', '.'))
        rest = rest.replace(precioMatch[0], '').trim()
      }

      // Extract cantidad
      // Handles: "2k ", "500g ", "1l " (unit+space at start)
      //          "2kMaizola" (unit glued to product name)
      //          "2 k " (digit space unit space)
      //          "3x ", "x3 ", "3 ", "(3)", " x3"
      let cantidad = 1
      const UNIT = /(?:k|kg|g|gr|l|ml|cc)/i
      const cantPatterns: [RegExp, (m: RegExpMatchArray) => number, RegExp][] = [
        // "3x " or "x3 " at start
        [/^(\d+)\s*[xX×]\s+/, (m) => parseInt(m[1]), /^(\d+)\s*[xX×]\s+/],
        [/^[xX×]\s*(\d+)\s+/, (m) => parseInt(m[1]), /^[xX×]\s*(\d+)\s+/],
        // "2k Yerba" or "500g Sal" — number+unit then space (keep unit as part of consumed prefix)
        [new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*${UNIT.source}\\s+`, 'i'),
          (m) => parseFloat(m[1].replace(',', '.')),
          new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*${UNIT.source}\\s+`, 'i')],
        // "2kMaizola" — number+unit glued directly to product name
        [new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*${UNIT.source}(?=[a-záéíóúüñA-ZÁÉÍÓÚÜÑ])`, 'i'),
          (m) => parseFloat(m[1].replace(',', '.')),
          new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*${UNIT.source}(?=[a-záéíóúüñA-ZÁÉÍÓÚÜÑ])`, 'i')],
        // "2 k Harina" — digit, space, unit, space
        [new RegExp(`^(\\d+)\\s+${UNIT.source}\\s+`, 'i'),
          (m) => parseInt(m[1]),
          new RegExp(`^(\\d+)\\s+${UNIT.source}\\s+`, 'i')],
        // "3 " at start (integer then space, not followed by "/" which means fraction)
        [/^(\d+)\s+(?!\d*\/)/, (m) => parseInt(m[1]), /^(\d+)\s+(?!\d*\/)/],
        // "(3)" at end
        [/\s*\((\d+)\)\s*$/, (m) => parseInt(m[1]), /\s*\((\d+)\)\s*$/],
        // " x3" or " x 3" at end
        [/\s+[xX×]\s*(\d+)\s*$/, (m) => parseInt(m[1]), /\s+[xX×]\s*(\d+)\s*$/],
      ]
      for (const [testPat, extract, removePat] of cantPatterns) {
        const m = rest.match(testPat)
        if (m) {
          cantidad = Math.round(extract(m)) || 1
          rest = rest.replace(removePat, ' ').trim()
          break
        }
      }

      // Clean up name: collapse whitespace
      const nombre = rest.replace(/\s+/g, ' ').trim()
      if (!nombre || nombre.length < 2) continue

      results.push({ producto: nombre, cantidad, precio })
    }
  }

  return results
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Mode = 'manual' | 'texto' | 'imagen'

interface SmartProductInputProps {
  products: ProductFormData[]
  onChange: (products: ProductFormData[]) => void
}

// ─── Preview table ────────────────────────────────────────────────────────────

function ParsedPreview({
  items, onConfirm, onDiscard
}: {
  items: ProductFormData[]
  onConfirm: () => void
  onDiscard: () => void
}) {
  return (
    <div className='mt-3 border border-emerald-200 bg-emerald-50 rounded-xl p-4'>
      <div className='flex items-center gap-2 mb-3'>
        <CheckCircle className='h-4 w-4 text-emerald-600' />
        <p className='text-sm font-semibold text-emerald-800'>
          {items.length} producto{items.length !== 1 ? 's' : ''} detectado{items.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className='space-y-1.5 mb-4'>
        {items.map((p, i) => (
          <div key={i} className='flex items-center justify-between bg-white rounded-lg px-3 py-2 text-sm border border-emerald-100'>
            <span className='font-medium text-gray-800 flex-1 truncate'>{p.producto}</span>
            <span className='text-gray-500 ml-3 flex-shrink-0'>
              {p.cantidad}× {p.precio > 0 ? `$${p.precio}` : <span className='text-gray-400 italic'>sin precio</span>}
            </span>
          </div>
        ))}
      </div>
      <div className='flex gap-2'>
        <button
          type='button'
          onClick={onConfirm}
          className='flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700'
        >
          <CheckCircle className='h-4 w-4' /> Agregar todos
        </button>
        <button
          type='button'
          onClick={onDiscard}
          className='flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50'
        >
          <X className='h-4 w-4' /> Descartar
        </button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SmartProductInput({ products, onChange }: SmartProductInputProps) {
  const [mode, setMode] = useState<Mode>('manual')
  const [text, setText] = useState('')
  const [parsed, setParsed] = useState<ProductFormData[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const callAPI = useCallback(async (body: object): Promise<boolean> => {
    setLoading(true)
    setError(null)
    setParsed(null)
    try {
      const res = await fetch('/api/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error del servidor')
      if (!data.productos?.length) {
        setError('No se detectaron productos. Intentá con otro texto o imagen.')
        return false
      }
      setParsed(data.productos)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al procesar')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const handleParseText = () => {
    if (!text.trim()) return
    callAPI({ text })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setImagePreview(dataUrl)
      // Strip "data:image/...;base64," prefix
      const base64 = dataUrl.split(',')[1]
      const mediaType = file.type
      await callAPI({ imageBase64: base64, mediaType })
    }
    reader.readAsDataURL(file)
  }

  const confirmParsed = () => {
    if (!parsed) return
    onChange([...products, ...parsed])
    setParsed(null)
    setText('')
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const discardParsed = () => {
    setParsed(null)
    setError(null)
  }

  const TABS: { id: Mode; label: string; icon: React.ElementType }[] = [
    { id: 'manual', label: 'Manual',  icon: Keyboard },
    { id: 'texto',  label: 'Texto',   icon: FileText },
    { id: 'imagen', label: 'Imagen',  icon: Camera },
  ]

  return (
    <div className='space-y-4'>
      {/* Mode tabs */}
      <div className='flex gap-1 bg-gray-100 rounded-xl p-1 w-fit'>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type='button'
            onClick={() => { setMode(id); setParsed(null); setError(null) }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className='h-3.5 w-3.5' />
            {label}
          </button>
        ))}
      </div>

      {/* ── MANUAL ── */}
      {mode === 'manual' && (
        <ProductList products={products} onChange={onChange} />
      )}

      {/* ── TEXTO ── */}
      {mode === 'texto' && (
        <div>
          <p className='text-xs text-gray-500 mb-2'>
            Pegá el mensaje de WhatsApp del cliente tal cual. La IA entiende cualquier formato — cantidades con unidades (2k, 1l, 500g), ítems separados por saltos de línea, "/", o comas, y puede haber varios pedidos en el mismo texto.
          </p>
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setParsed(null) }}
            rows={10}
            placeholder={'Pegá acá el mensaje del cliente...\n\nEj:\n2k flan\n1 lata grande choclo\n6k corbatitas puritas\n500g sal\nEn otra boleta\n2.5 cocoa la morocha\n1l vainilla'}
            className='w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono'
          />
          <div className='flex items-center gap-2 mt-2 flex-wrap'>
            <button
              type='button'
              onClick={handleParseText}
              disabled={!text.trim() || loading}
              className='flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50'
            >
              {loading ? <Loader2 className='h-4 w-4 animate-spin' /> : <FileText className='h-4 w-4' />}
              {loading ? 'Analizando con IA...' : 'Analizar con IA'}
            </button>
            {text.trim() && !loading && (
              <button type='button' onClick={() => { setText(''); setParsed(null); setError(null) }}
                className='flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600'>
                <X className='h-3 w-3' /> Limpiar
              </button>
            )}
          </div>

          {error && (
            <div className='mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2'>
              <AlertCircle className='h-4 w-4 flex-shrink-0 mt-0.5' />
              {error}
            </div>
          )}
          {parsed && <ParsedPreview items={parsed} onConfirm={confirmParsed} onDiscard={discardParsed} />}

          {/* Also show current products */}
          {products.length > 0 && <ProductList products={products} onChange={onChange} />}
        </div>
      )}

      {/* ── IMAGEN ── */}
      {mode === 'imagen' && (
        <div>
          <p className='text-xs text-gray-500 mb-3'>
            Subí una foto del pedido escrito a mano, un ticket o una lista. Claude lo lee y extrae los productos automáticamente.
          </p>

          {/* Drop zone */}
          <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl cursor-pointer transition-colors p-6 ${imagePreview ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}>
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt='preview' className='max-h-48 rounded-lg object-contain' />
            ) : (
              <>
                <Camera className='h-8 w-8 text-gray-400' />
                <span className='text-sm text-gray-500'>Hacé click para subir una foto</span>
                <span className='text-xs text-gray-400'>JPG, PNG, WEBP — máx 5MB</span>
              </>
            )}
            <input
              ref={fileRef}
              type='file'
              accept='image/jpeg,image/png,image/webp,image/gif'
              onChange={handleImageChange}
              className='hidden'
            />
          </label>

          {imagePreview && (
            <button
              type='button'
              onClick={() => { setImagePreview(null); setParsed(null); setError(null); if (fileRef.current) fileRef.current.value = '' }}
              className='mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600'
            >
              <X className='h-3 w-3' /> Cambiar imagen
            </button>
          )}

          {loading && (
            <div className='mt-4 flex items-center gap-2 text-sm text-blue-600'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Analizando imagen con Claude...
            </div>
          )}

          {error && (
            <div className='mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2'>
              <AlertCircle className='h-4 w-4 flex-shrink-0 mt-0.5' />
              <div>
                {error}
                {error.includes('ANTHROPIC_API_KEY') && (
                  <p className='mt-1 text-xs text-red-400'>Agregá ANTHROPIC_API_KEY al archivo .env para usar esta función.</p>
                )}
              </div>
            </div>
          )}

          {parsed && <ParsedPreview items={parsed} onConfirm={confirmParsed} onDiscard={discardParsed} />}

          {/* Current products */}
          {products.length > 0 && <div className='mt-4'><ProductList products={products} onChange={onChange} /></div>}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2, ExternalLink } from 'lucide-react'

type Suggestion = {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: {
    road?: string
    pedestrian?: string
    house_number?: string
    city?: string
    town?: string
    village?: string
  }
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Ej: Av. Corrientes 1234, Buenos Aires',
  className = '',
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef(value)
  const debouncedValue = useDebounce(value, 400)

  useEffect(() => { valueRef.current = value }, [value])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fetch suggestions
  useEffect(() => {
    if (selected) { setSelected(false); return }
    if (!debouncedValue || debouncedValue.length < 4) { setSuggestions([]); setOpen(false); return }

    setLoading(true)
    // Restrict to Florida, Uruguay — append city context and bound to UY + viewbox around Florida dept.
    const query = `${debouncedValue}, Florida, Uruguay`
    const viewbox = '-57.5,-33.0,-55.0,-34.8' // lon_min,lat_max,lon_max,lat_min (Florida dept.)
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1&countrycodes=uy&viewbox=${viewbox}&bounded=0`

    fetch(url, { headers: { 'Accept-Language': 'es' } })
      .then((r) => r.json())
      .then((data: Suggestion[]) => {
        setSuggestions(data)
        setOpen(data.length > 0)
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false))
  }, [debouncedValue]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback((s: Suggestion) => {
    let formatted: string
    if (s.address) {
      const street = s.address.road ?? s.address.pedestrian ?? ''
      // If Nominatim didn't index the house number, extract it from what the user typed
      const number = s.address.house_number ?? valueRef.current.match(/\d+/)?.[0] ?? ''
      const city = s.address.city ?? s.address.town ?? s.address.village ?? ''
      const streetWithNumber = [street, number].filter(Boolean).join(' ')
      formatted = city ? `${streetWithNumber}, ${city}` : streetWithNumber
    } else {
      formatted = s.display_name.split(',').slice(0, 3).join(',').trim()
    }
    onChange(formatted)
    setSelected(true)
    setSuggestions([])
    setOpen(false)
  }, [onChange])

  const mapsUrl = value
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`
    : null

  return (
    <div ref={containerRef} className='relative'>
      {/* Input */}
      <div className='relative'>
        <MapPin className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
        <input
          type='text'
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={`w-full pl-9 pr-28 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        />
        <div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1'>
          {loading && <Loader2 className='h-3.5 w-3.5 animate-spin text-gray-400' />}
          {mapsUrl && !loading && (
            <a
              href={mapsUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors'
              title='Ver en Google Maps'
            >
              <ExternalLink className='h-3 w-3' />
              Ver mapa
            </a>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <ul className='absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto'>
          {suggestions.map((s) => {
            const parts = s.display_name.split(',')
            const street = s.address?.road ?? s.address?.pedestrian ?? ''
            const number = s.address?.house_number ?? ''
            const city = s.address?.city ?? s.address?.town ?? s.address?.village ?? ''
            const main = street ? [street, number].filter(Boolean).join(' ') : parts.slice(0, 2).join(',').trim()
            const sub = city || parts.slice(2, 4).join(',').trim()
            return (
              <li key={s.place_id}>
                <button
                  type='button'
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(s) }}
                  className='w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors flex items-start gap-2.5 group'
                >
                  <MapPin className='h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 mt-0.5' />
                  <span>
                    <span className='block text-sm text-gray-900'>{main}</span>
                    {sub && <span className='block text-xs text-gray-400 truncate'>{sub}</span>}
                  </span>
                </button>
              </li>
            )
          })}
          <li className='px-3 py-1.5 border-t border-gray-100'>
            <span className='text-xs text-gray-400'>Fuente: © OpenStreetMap</span>
          </li>
        </ul>
      )}

      {/* Hint */}
      {value && !open && (
        <p className='mt-1 text-xs text-gray-400 flex items-center gap-1'>
          <MapPin className='h-3 w-3' />
          Verificá que la dirección sea correcta antes de guardar
        </p>
      )}
    </div>
  )
}

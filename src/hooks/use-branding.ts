'use client'

import { useState, useEffect, useCallback } from 'react'

export interface BrandingConfig {
  businessName: string
  subtitle: string
  navColor: string   // hex, e.g. "#9f1239"
}

const STORAGE_KEY = 'app_branding'

const DEFAULTS: BrandingConfig = {
  businessName: 'Patricia',
  subtitle: 'Autoservice',
  navColor: '#9f1239', // red-800
}

export function useBranding() {
  const [branding, setBrandingState] = useState<BrandingConfig>(DEFAULTS)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setBrandingState({ ...DEFAULTS, ...JSON.parse(raw) })
    } catch {/* use defaults */}
  }, [])

  const saveBranding = useCallback((next: BrandingConfig) => {
    setBrandingState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  return { branding, saveBranding }
}

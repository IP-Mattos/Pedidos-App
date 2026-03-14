'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { ProfileService } from '@/lib/services/profile-services'

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/verification-success', '/auth-code-error']

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', setTheme: () => {} })

function applyThemeClass(t: Theme) {
  if (typeof document === 'undefined') return
  if (t === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const { user } = useAuth()
  const pathname = usePathname()
  const isAuthPage = AUTH_PATHS.some((p) => pathname?.startsWith(p))

  const setTheme = (t: Theme) => {
    applyThemeClass(t)
    localStorage.setItem('theme', t)
    setThemeState(t)
  }

  // Leer localStorage al montar (sin esperar a Supabase → sin flash)
  // Saltear en páginas de auth — siempre deben mostrarse en modo claro
  useEffect(() => {
    if (isAuthPage) {
      applyThemeClass('light')
      return
    }
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved === 'dark' || saved === 'light') {
      applyThemeClass(saved)
      setThemeState(saved)
    }
  }, [isAuthPage])

  // Cuando el usuario carga, sincronizar desde Supabase
  useEffect(() => {
    if (!user || isAuthPage) return
    ProfileService.getUserPreferences(user.id)
      .then((prefs) => {
        if (prefs?.theme === 'dark' || prefs?.theme === 'light') {
          setTheme(prefs.theme as Theme)
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthPage])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

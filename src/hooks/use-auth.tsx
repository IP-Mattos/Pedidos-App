'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  isHydrated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const fetchProfile = useCallback(async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist — create it
          const { data: { session } } = await supabase.auth.getSession()
          const u = session?.user
          if (!u) return
          const newProfile = {
            id: userId,
            email: u.email || '',
            full_name: u.user_metadata?.full_name || 'Usuario',
            role: 'worker' as const
          }
          const { data: created } = await supabase.from('profiles').insert([newProfile]).select().single()
          if (created) setProfile(created)
          return
        }
        setProfile(null)
        return
      }

      setProfile(data)
    } catch {
      setProfile(null)
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    if (!isHydrated) return

    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          if (mounted) { setUser(null); setProfile(null); setLoading(false) }
          return
        }

        const u = session?.user || null
        if (mounted) setUser(u)

        if (u && mounted) {
          fetchProfile(u.id).catch(() => {})
        }

        if (mounted) setLoading(false)
      } catch {
        if (mounted) { setUser(null); setProfile(null); setLoading(false) }
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      const u = session?.user || null
      setUser(u)
      if (u) {
        fetchProfile(u.id).catch(() => {})
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [isHydrated, supabase, fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [supabase])

  const contextValue = useMemo(
    () => ({ user, profile, loading, signOut, refreshProfile, isHydrated }),
    [user, profile, loading, signOut, refreshProfile, isHydrated]
  )

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

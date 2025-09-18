'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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
  const supabase = createClient()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const fetchProfile = async (userId: string): Promise<void> => {
    try {
      console.log('🔍 Fetching profile for user:', userId)

      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

      if (error) {
        console.error('❌ Error fetching profile:', error)

        // Si el perfil no existe, intentar crearlo
        if (error.code === 'PGRST116') {
          console.log('📝 Profile not found, attempting to create...')
          await createProfile(userId)
          return
        }

        setProfile(null)
        return
      }

      console.log('✅ Profile loaded successfully:', data)
      setProfile(data)
    } catch (error) {
      console.error('💥 Unexpected error fetching profile:', error)
      setProfile(null)
    }
  }

  const createProfile = async (userId: string) => {
    try {
      // Obtener información del usuario actual
      const {
        data: { session }
      } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        console.error('No user session when creating profile')
        return
      }

      console.log('Creating profile for user:', user.email)

      const newProfile = {
        id: userId,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'Usuario',
        role: 'worker' as const
      }

      const { data, error } = await supabase.from('profiles').insert([newProfile]).select().single()

      if (error) {
        console.error('Error creating profile:', error)
        setProfile(null)
        return
      }

      console.log('Profile created successfully:', data)
      setProfile(data)
    } catch (error) {
      console.error('Unexpected error creating profile:', error)
      setProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    if (!isHydrated) return

    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth...')

        // Usar getSession en lugar de getUser para evitar el error
        const {
          data: { session },
          error
        } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ Error getting session:', error)
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        const user = session?.user || null
        console.log('👤 Session check result:', user?.email || 'No user')
        setUser(user)

        if (user && mounted) {
          // Cargar perfil sin bloquear el loading principal
          fetchProfile(user.id).catch((error) => {
            console.warn('⚠️ Profile fetch failed during init:', error)
          })
        }

        // Marcar como no loading independientemente del perfil
        if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('💥 Auth initialization failed:', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Escuchar cambios de autenticación
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user')

      const user = session?.user || null
      setUser(user)

      if (user) {
        fetchProfile(user.id).catch((error) => {
          console.warn('⚠️ Profile fetch failed during auth change:', error)
        })
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [isHydrated])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile, isHydrated }}>
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

import { createClient } from '@/lib/supabase/server'

export class ServerAuthService {
  static async getUser() {
    const supabase = await createClient()

    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error) {
      throw new Error(error.message)
    }

    return user
  }

  static async getProfile() {
    const supabase = await createClient()

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    if (error) {
      throw new Error(error.message)
    }

    return profile
  }

  static async getUserWithProfile() {
    const supabase = await createClient()

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) return { user: null, profile: null }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    return { user, profile }
  }
}

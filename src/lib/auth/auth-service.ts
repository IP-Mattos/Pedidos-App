import { createClient } from '@/lib/supabase/client'
import type {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData
} from '@/lib/validations/auth'

export class AuthService {
  static async login({ email, password }: LoginFormData) {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  static async register({ email, password, fullName }: RegisterFormData) {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  static async forgotPassword({ email }: ForgotPasswordFormData) {
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  static async resetPassword({ password }: ResetPasswordFormData) {
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  static async logout() {
    const supabase = createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error(error.message)
    }
  }

  static async resendVerification(email: string) {
    const supabase = createClient()

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    })

    if (error) {
      throw new Error(error.message)
    }
  }
  static async updateUser(updates: { password?: string; email?: string; data?: any }) {
    const supabase = createClient()

    const { data, error } = await supabase.auth.updateUser(updates)

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  static async changePassword(newPassword: string) {
    const supabase = createClient()

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  static async sendPasswordResetEmail(email: string) {
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
    })

    if (error) {
      throw new Error(error.message)
    }
  }
}

export interface User {
  id: string
  email?: string
  email_confirmed_at?: string
  created_at: string
  updated_at: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export interface AuthError {
  message: string
  status?: number
}

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
}

export interface ForgotPasswordFormData {
  email: string
}

export interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

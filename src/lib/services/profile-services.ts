import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

export class ProfileService {
  // Obtener perfil del usuario actual
  static async getCurrentProfile(): Promise<Profile | null> {
    const supabase = createClient()

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Usuario no autenticado')
    }

    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    if (error) {
      throw new Error(error.message)
    }

    return profile
  }

  // Actualizar perfil
  static async updateProfile(userId: string, updates: Partial<Pick<Profile, 'full_name'>>): Promise<Profile> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  // Cambiar contraseña
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const supabase = createClient()

    // Primero verificar la contraseña actual intentando hacer login
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user?.email) {
      throw new Error('Usuario no autenticado')
    }

    // Verificar contraseña actual
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })

    if (signInError) {
      throw new Error('La contraseña actual es incorrecta')
    }

    // Actualizar a la nueva contraseña
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  // Actualizar avatar (para futuras implementaciones)
  static async updateAvatar(userId: string, avatarFile: File): Promise<string> {
    const supabase = createClient()

    // Subir archivo
    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${userId}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage.from('profiles').upload(filePath, avatarFile)

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    // Obtener URL pública
    const {
      data: { publicUrl }
    } = supabase.storage.from('profiles').getPublicUrl(filePath)

    // Actualizar perfil con la nueva URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    return publicUrl
  }

  // Obtener configuraciones del usuario
  static async getUserPreferences(userId: string) {
    const supabase = createClient()

    const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', userId).single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    return data
  }

  // Actualizar configuraciones del usuario
  static async updateUserPreferences(
    userId: string,
    preferences: {
      theme?: 'light' | 'dark'
      notifications_enabled?: boolean
      email_notifications?: boolean
      language?: string
    }
  ) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  // Obtener estadísticas del usuario (para workers)
  static async getUserStats(userId: string) {
    const supabase = createClient()

    // Pedidos asignados
    const { data: assignedOrders, error: assignedError } = await supabase
      .from('orders')
      .select('id, status, created_at')
      .eq('assigned_to', userId)

    if (assignedError) {
      throw new Error(assignedError.message)
    }

    // Progreso de pedidos
    const { data: progressEntries, error: progressError } = await supabase
      .from('order_progress')
      .select('id, created_at, status')
      .eq('worker_id', userId)

    if (progressError) {
      throw new Error(progressError.message)
    }

    // Calcular estadísticas
    const totalAssigned = assignedOrders?.length || 0
    const completed = assignedOrders?.filter((o) => o.status === 'completado' || o.status === 'entregado').length || 0
    const inProgress = assignedOrders?.filter((o) => o.status === 'en_proceso').length || 0
    const totalUpdates = progressEntries?.length || 0

    return {
      totalAssigned,
      completed,
      inProgress,
      totalUpdates,
      completionRate: totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0
    }
  }

  // Eliminar cuenta (soft delete)
  static async deactivateAccount(userId: string): Promise<void> {
    const supabase = createClient()

    // Marcar perfil como inactivo
    const { error } = await supabase
      .from('profiles')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      throw new Error(error.message)
    }

    // Cerrar sesión del usuario
    await supabase.auth.signOut()
  }

  // Reactivar cuenta
  static async reactivateAccount(userId: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        is_active: true,
        deactivated_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      throw new Error(error.message)
    }
  }
}

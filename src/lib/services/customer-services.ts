import { createClient } from '@/lib/supabase/client'
import type { Customer } from '@/types/database'

export class CustomerService {
  static async search(query: string): Promise<Customer[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .ilike('nombre', `%${query}%`)
      .order('nombre')
      .limit(8)
    if (error) return []
    return data ?? []
  }

  static async getAll(): Promise<Customer[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('nombre')
    if (error) throw new Error(error.message)
    return data ?? []
  }

  static async getById(id: string): Promise<Customer | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data
  }

  // Finds by exact name (case-insensitive). Returns null if not found.
  static async findByName(nombre: string): Promise<Customer | null> {
    const supabase = createClient()
    const { data } = await supabase
      .from('customers')
      .select('*')
      .ilike('nombre', nombre.trim())
      .limit(1)
      .maybeSingle()
    return data ?? null
  }

  // Creates or updates a customer by name. Returns the customer.
  static async upsertByName(
    nombre: string,
    phone?: string | null,
    address?: string | null,
    rut?: string | null
  ): Promise<Customer> {
    const supabase = createClient()
    const existing = await CustomerService.findByName(nombre)

    if (existing) {
      const updates: Partial<Customer> = { updated_at: new Date().toISOString() }
      if (phone !== undefined) updates.phone = phone || null
      if (address !== undefined) updates.address = address || null
      if (rut !== undefined) updates.rut = rut || null
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({ nombre: nombre.trim(), phone: phone || null, address: address || null, rut: rut || null })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  static async update(id: string, updates: { nombre?: string; phone?: string | null; address?: string | null; rut?: string | null }): Promise<Customer> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  static async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  // Returns customers with order counts by joining orders
  static async getAllWithStats(): Promise<(Customer & { order_count: number; last_order_at: string | null })[]> {
    const supabase = createClient()
    const [{ data: customers, error }, { data: orders }] = await Promise.all([
      supabase.from('customers').select('*').order('nombre'),
      supabase.from('orders').select('nombre_cliente, created_at')
    ])
    if (error) throw new Error(error.message)
    return (customers ?? []).map((c) => {
      const clientOrders = (orders ?? []).filter(
        (o) => o.nombre_cliente.toLowerCase() === c.nombre.toLowerCase()
      )
      const sorted = clientOrders.sort((a, b) => b.created_at.localeCompare(a.created_at))
      return {
        ...c,
        order_count: clientOrders.length,
        last_order_at: sorted[0]?.created_at ?? null
      }
    })
  }
}

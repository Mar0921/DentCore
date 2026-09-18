import { supabase } from '@/lib/supabase'
import type { Laboratorio } from '@/types/lab'

export async function getLaboratorio(id: string): Promise<Laboratorio | null> {
  const { data, error } = await supabase
    .from('laboratorio')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function updateLaboratorio(id: string, updates: Partial<Laboratorio>) {
  const { data, error } = await supabase
    .from('laboratorio')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function uploadLogo(file: File, laboratorioId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${laboratorioId}/logo.${fileExt}`

  const { data, error } = await supabase.storage
    .from('logos-laboratorios')
    .upload(fileName, file, { upsert: true })

  if (error) throw error

  const { data: publicUrl } = supabase.storage
    .from('logos-laboratorios')
    .getPublicUrl(data.path)

  return publicUrl.publicUrl
}

export async function createLaboratorio(data: {
  nombre: string
  email: string
  telefono?: string
  direcccion?: string
  ciudad?: string
  plan: 'starter' | 'professional' | 'enterprise'
  logo?: string
}) {
  const { data: result, error } = await supabase
    .from('laboratorio')
    .insert({
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono || null,
      direcccion: data.direcccion || null,
      ciudad: data.ciudad || null,
      plan: data.plan,
      logo_url: data.logo || null,
      susactivo: false,
    })
    .select()
    .single()

  if (error) throw error
  return result
}

export async function createAdmin(data: {
  laboratorioId: string
  nombre: string
  email: string
  password: string
}) {
  const { data: result, error } = await supabase
    .from('empleados')
    .insert({
      laboratorio_id: data.laboratorioId,
      nombre: data.nombre,
      email: data.email,
      contraseña: data.password, // En producción, hashear con bcrypt
      rol: 'admin',
      departamento: 'Administración',
      activo: true,
    })
    .select()
    .single()

  if (error) throw error
  return result
}

export async function getLaboratorioByAdminEmail(email: string) {
  const { data, error } = await supabase
    .from('empleados')
    .select('laboratorio_id')
    .eq('email', email)
    .eq('rol', 'admin')
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function getEmpleadosByLaboratorio(laboratorioId: string) {
  const { data, error } = await supabase
    .from('empleados')
    .select('*')
    .eq('laboratorio_id', laboratorioId)

  if (error) throw error
  return data
}
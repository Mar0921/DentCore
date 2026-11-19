import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const labId = searchParams.get('laboratorio_id')
  let q = supabase.from('tipos_incidencia').select('*').order('nombre')
  if (labId) q = q.eq('laboratorio_id', labId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { nombre, laboratorio_id = null } = body
  if (!nombre) return NextResponse.json({ error: 'nombre requerido' }, { status: 400 })
  const { data, error } = await supabase.from('tipos_incidencia').insert({ nombre, laboratorio_id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

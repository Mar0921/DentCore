import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const incidenciaId = searchParams.get('incidencia_id')
    let query = supabase.from('incidencia_medidas').select('*').order('created_at', { ascending: true })
    if (incidenciaId) {
      query = query.eq('incidencia_id', incidenciaId)
    }
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 200 })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { incidencia_id, estado, fecha_resolucion = null, responsable = null, medidas_tomadas } = body
    if (!incidencia_id || !medidas_tomadas) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('incidencia_medidas')
      .insert({
        incidencia_id,
        estado: estado || 'nueva',
        fecha_resolucion: fecha_resolucion || null,
        responsable,
        medidas_tomadas,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) {
      console.error('Error inserting medida:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data }, { status: 200 })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

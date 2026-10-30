import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const solicitudId = request.nextUrl.searchParams.get('solicitud_id')
    if (!solicitudId) {
      return NextResponse.json({ error: 'solicitud_id es requerido' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('fichas_tecnicas')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching fichas tecnicas:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] }, { status: 200 })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { solicitud_id, laboratorio_id, tipo, nombre, nombre_archivo, fecha, secciones } = body

    if (!solicitud_id || !tipo) {
      return NextResponse.json({ error: 'solicitud_id y tipo son requeridos' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('fichas_tecnicas')
      .insert({
        solicitud_id,
        laboratorio_id: laboratorio_id || null,
        tipo,
        nombre: nombre_archivo || nombre || tipo,
        nombre_archivo: nombre_archivo || nombre || tipo,
        fecha: fecha || new Date().toISOString().split('T')[0],
        secciones: secciones || [],
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving ficha tecnica:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const fichaId = request.nextUrl.searchParams.get('id')
    if (!fichaId) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    const body = await request.json()
    const { tipo, nombre, fecha, secciones } = body

    const updateData: Record<string, unknown> = {}
    if (tipo !== undefined) updateData.tipo = tipo
    if (nombre !== undefined || (body as any).nombre_archivo !== undefined) {
      const n = nombre ?? (body as any).nombre_archivo
      updateData.nombre = n
      updateData.nombre_archivo = n
    }
    if (fecha !== undefined) updateData.fecha = fecha
    if (secciones !== undefined) updateData.secciones = secciones
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('fichas_tecnicas')
      .update(updateData)
      .eq('id', fichaId)
      .select()
      .single()

    if (error) {
      console.error('Error updating ficha tecnica:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const fichaId = request.nextUrl.searchParams.get('id')
    if (!fichaId) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    const { error } = await supabase.from('fichas_tecnicas').delete().eq('id', fichaId)

    if (error) {
      console.error('Error deleting ficha tecnica:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

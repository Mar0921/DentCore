import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const solicitudId = searchParams.get('solicitud_id')
    const id = searchParams.get('id')

    if (id) {
      const { data, error } = await supabase.from('incidencias').select('*').eq('id', id).maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data }, { status: 200 })
    }

    let query = supabase.from('incidencias').select('*').order('fecha_creacion', { ascending: false })
    if (solicitudId) {
      query = query.eq('solicitud_id', solicitudId)
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
    const {
      solicitud_id,
      solicitud_codigo_trazabilidad = null,
      tipo,
      fecha,
      hora,
      fase = null,
      descripcion,
      responsable = null,
      estado = 'abierta',
    } = body

    if (!tipo || !fecha || !hora || !descripcion || !solicitud_id) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    let codigo = ''
    for (let i = 0; i < 20; i++) {
      const c = 'INC-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0')
      const { data: exists } = await supabase.from('incidencias').select('id').eq('codigo', c).maybeSingle()
      if (!exists) {
        codigo = c
        break
      }
    }
    if (!codigo) {
      codigo = 'INC-' + Date.now().toString().slice(-6)
    }

    const now = new Date().toISOString()
    const basePayload: any = {
      solicitud_id,
      tipo,
      descripcion,
      responsable,
      estado,
      fecha_creacion: now,
      updated_at: now,
    }

    const tryInsert = async (payload: any) => {
      return await supabase.from('incidencias').insert(payload).select().single()
    }

    const candidates = [
      { ...basePayload, codigo, fase, fecha, hora, solicitud_codigo_trazabilidad },
      { ...basePayload, codigo, fase, fecha, hora },
      { ...basePayload, codigo, fecha, hora, solicitud_codigo_trazabilidad },
      { ...basePayload, codigo, fecha, hora },
      { ...basePayload, fase, fecha, hora },
      { ...basePayload, fecha, hora },
      { ...basePayload, codigo },
      basePayload,
    ]

    for (const p of candidates) {
      const result = await tryInsert(p)
      if (!result.error) return NextResponse.json({ data: result.data }, { status: 200 })
    }

    const last = await tryInsert(candidates[candidates.length - 1])
    if (last.error) {
      console.error('Error inserting incidencia:', last.error)
      return NextResponse.json({ error: last.error.message }, { status: 500 })
    }
    return NextResponse.json({ data: last.data }, { status: 200 })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    const { data, error } = await supabase
      .from('incidencias')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 200 })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    const { error } = await supabase.from('incidencias').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

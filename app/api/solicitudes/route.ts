import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      laboratorio_id = null,
      odontologo_id = null,
      odontologonombre = null,
      odontologo_email = null,
      odontologo_telefono = null,
      tipo = 'TEST',
      estado = 'pendiente',
      prioridad = 'media',
      progreso = 0,
      asignado_a = null,
      notas = null,
      dientes = null,
      ...rest
    } = body

    const now = new Date().toISOString()

    let finalOdontologoId = odontologo_id
    if (!finalOdontologoId && odontologonombre) {
      const { data: odontoData, error: odontoLookupError } = await supabase
        .from('odontologos')
        .select('id')
        .or(`nombre.eq.${odontologonombre},clinica.eq.${odontologonombre},email.eq.${odontologonombre}`)
        .single()
      if (!odontoLookupError && odontoData?.id) {
        finalOdontologoId = odontoData.id
      } else {
        const { data: newOdonto, error: upsertError } = await supabase
          .from('odontologos')
          .upsert({
            nombre: odontologonombre,
            email: odontologo_email || null,
            clinica: null,
            especialidad: null,
            telefono: odontologo_telefono || null,
            laboratorio_id: laboratorio_id || null,
          })
          .select()
          .single()
        if (!upsertError && newOdonto?.id) {
          finalOdontologoId = newOdonto.id
        }
      }
    }

    const { data, error } = await supabase.from('solicitudes').insert({
      laboratorio_id,
      odontologo_id: finalOdontologoId,
      odontologonombre: odontologonombre || null,
      odontologo_email: odontologo_email || null,
      odontologo_telefono: odontologo_telefono || null,
      tipo,
      estado,
      prioridad,
      progreso,
      asignado_a,
      dientes: dientes || null,
      notas: notas || null,
      created_at: now,
      updated_at: now,
      ...rest,
    }).select()

    if (error) {
      console.error('Error inserting solicitud:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    const query = supabase.from('solicitudes').select('*')
    const { data, error } = id
      ? await query.eq('id', id).maybeSingle()
      : await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching solicitudes:', error)
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
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('solicitudes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating solicitud:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      const { data, error } = await supabase
        .from('solicitud_observaciones')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data }, { status: 200 })
    }

    let query = supabase
      .from('solicitud_observaciones')
      .select('*')
      .order('created_at', { ascending: true })

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
    const { solicitud_id, texto } = body

    if (!solicitud_id || !texto || !String(texto).trim()) {
      return NextResponse.json({ error: 'solicitud_id y texto son requeridos' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('solicitud_observaciones')
      .insert({
        solicitud_id,
        texto: String(texto).trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting solicitud_observacion:', error)
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
    if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

    if (updates.texto) {
      updates.texto = String(updates.texto).trim()
    }

    const { data, error } = await supabase
      .from('solicitud_observaciones')
      .update(updates)
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

    const { error } = await supabase.from('solicitud_observaciones').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

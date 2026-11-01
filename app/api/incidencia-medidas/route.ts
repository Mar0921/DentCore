import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

function mapMedidaEstadoToIncidenciaEstado(estadoMedida?: string | null): 'abierta' | 'en_proceso' | 'cerrada' {
  const estado = (estadoMedida || 'nueva').toLowerCase().trim()

  if (estado === 'resuelta' || estado === 'aplicada' || estado === 'cerrada') {
    return 'cerrada'
  }

  if (estado === 'en_proceso') {
    return 'en_proceso'
  }

  return 'abierta'
}

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

    const estadoMedida = estado || 'nueva'

    const { data, error } = await supabase
      .from('incidencia_medidas')
      .insert({
        incidencia_id,
        estado: estadoMedida,
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

    try {
      // Obtener la última medida aplicada para asegurar que el estado sea el correcto
      const { data: medidas } = await supabase
        .from('incidencia_medidas')
        .select('estado')
        .eq('incidencia_id', incidencia_id)
        .order('created_at', { ascending: false })
        .limit(1)

      const ultimoEstado = medidas && medidas[0] ? medidas[0].estado : estadoMedida
      const nuevoEstadoIncidencia = mapMedidaEstadoToIncidenciaEstado(ultimoEstado)

      const { error: updateError } = await supabase
        .from('incidencias')
        .update({
          estado: nuevoEstadoIncidencia,
          updated_at: new Date().toISOString(),
        })
        .eq('id', incidencia_id)

      if (updateError) {
        console.error('Error updating incidencia estado:', updateError)
      }
    } catch (updateErr) {
      console.error('Error updating incidencia estado:', updateErr)
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

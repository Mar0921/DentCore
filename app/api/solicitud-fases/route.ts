import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      solicitud_id,
      producto_fase_id,
      fase_id,
      estado,
      fecha_finalizacion,
      realizado_por,
      evidencia,
    } = body

    if (!solicitud_id || !producto_fase_id) {
      return NextResponse.json({ error: 'solicitud_id y producto_fase_id son requeridos' }, { status: 400 })
    }

    // Upsert en solicitud_fases
    const { data: sfData, error: sfError } = await supabase
      .from('solicitud_fases')
      .upsert(
        {
          solicitud_id,
          producto_fase_id,
          estado: estado || 'pendiente',
          fecha_finalizacion: fecha_finalizacion || null,
          realizado_por: realizado_por || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'solicitud_id,producto_fase_id' },
      )
      .select('id')
      .single()

    if (sfError) {
      console.error('Error upserting solicitud_fases:', sfError)
      return NextResponse.json({ error: sfError.message }, { status: 500 })
    }

    // Si hay evidencia, guardar en fases_evidencias
    if (evidencia) {
      const { data: existingEv, error: findEvErr } = await supabase
        .from('fases_evidencias')
        .select('id')
        .eq('solicitud_id', solicitud_id)
        .eq('producto_fase_id', producto_fase_id)
        .maybeSingle()

      if (findEvErr) {
        console.error('Error finding evidence:', findEvErr)
        return NextResponse.json({ error: findEvErr.message }, { status: 500 })
      }

      if (existingEv) {
        const { error: updEvError } = await supabase
          .from('fases_evidencias')
          .update({
            archivo_url: evidencia.archivo_url,
            nombre_archivo: evidencia.nombre_archivo,
            tipo_mime: evidencia.tipo_mime,
            tamaño_bytes: evidencia.tamaño_bytes,
            empleado_id: evidencia.empleado_id || null,
            laboratorio_id: evidencia.laboratorio_id || null,
            creado_en: new Date().toISOString(),
          })
          .eq('id', existingEv.id)
        if (updEvError) {
          console.error('Error updating evidence:', updEvError)
          return NextResponse.json({ error: updEvError.message }, { status: 500 })
        }
      } else {
        const { error: insEvError } = await supabase
          .from('fases_evidencias')
          .insert({
            solicitud_id,
            producto_fase_id,
            fase_id,
            laboratorio_id: evidencia.laboratorio_id || null,
            empleado_id: evidencia.empleado_id || null,
            archivo_url: evidencia.archivo_url,
            nombre_archivo: evidencia.nombre_archivo,
            tipo_mime: evidencia.tipo_mime,
            tamaño_bytes: evidencia.tamaño_bytes,
          })
        if (insEvError) {
          console.error('Error inserting evidence:', insEvError)
          return NextResponse.json({ error: insEvError.message }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ data: sfData }, { status: 200 })
  } catch (e) {
    console.error('Error in solicitud-fases API:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const laboratorioId = searchParams.get('laboratorio_id')
    const clienteId = searchParams.get('cliente_id')
    const conversacionId = searchParams.get('conversacion_id')
    const action = searchParams.get('action')

    if (conversacionId) {
      const { data: mensajes, error } = await supabase.from('mensajes_chat').select('*').eq('conversacion_id', conversacionId).order('created_at', { ascending: true })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data: mensajes }, { status: 200 })
    }

    if (laboratorioId && action === 'clientes') {
      const { data: clientes, error } = await supabase.from('cliente').select('id, nombre, email, telefono, clinica').eq('laboratorio_id', laboratorioId).order('nombre', { ascending: true })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data: clientes }, { status: 200 })
    }

    if (laboratorioId) {
      const { data: conversaciones, error } = await supabase.from('conversaciones').select('*, cliente:cliente(id, nombre, email, telefono), solicitud:solicitudes(id, codigo_trazabilidad)').eq('laboratorio_id', laboratorioId).order('ultimo_mensaje_at', { ascending: false })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data: conversaciones }, { status: 200 })
    }

    if (clienteId) {
      const { data: conversaciones, error } = await supabase.from('conversaciones').select('*, laboratorio:laboratorio(id, nombre), solicitud:solicitudes(id, codigo_trazabilidad)').eq('cliente_id', clienteId).order('ultimo_mensaje_at', { ascending: false })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data: conversaciones }, { status: 200 })
    }

    return NextResponse.json({ error: 'Parametros requeridos' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'crear_conversacion') {
      const { laboratorio_id, cliente_id, solicitud_id, asunto } = data
      let query = supabase.from('conversaciones').select('*').eq('laboratorio_id', laboratorio_id).eq('cliente_id', cliente_id)
      if (solicitud_id) query = query.eq('solicitud_id', solicitud_id)
      const { data: existente } = await query.maybeSingle()
      if (existente) return NextResponse.json({ data: existente }, { status: 200 })
      const { data: conversacion, error } = await supabase.from('conversaciones').insert({ laboratorio_id, cliente_id, solicitud_id: solicitud_id || null, asunto: asunto || 'Consulta' }).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data: conversacion }, { status: 200 })
    }

    if (action === 'enviar_mensaje') {
      const { conversacion_id, remitente_tipo, remitente_id, contenido, tipo = 'texto', archivo_url, archivo_nombre } = data
      if (!conversacion_id || !contenido) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
      const { data: mensaje, error } = await supabase.from('mensajes_chat').insert({ conversacion_id, remitente_tipo, remitente_id: remitente_id || null, contenido, tipo, archivo_url: archivo_url || null, archivo_nombre: archivo_nombre || null }).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data: mensaje }, { status: 200 })
    }

    if (action === 'marcar_leido') {
      const { conversacion_id, remitente_tipo } = data
      const otroTipo = remitente_tipo === 'cliente' ? ['laboratorio', 'empleado'] : ['cliente']
      const { error } = await supabase.from('mensajes_chat').update({ leido: true, leido_at: new Date().toISOString() }).eq('conversacion_id', conversacion_id).in('remitente_tipo', otroTipo).eq('leido', false)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true }, { status: 200 })
    }

    return NextResponse.json({ error: 'Accion no valida' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
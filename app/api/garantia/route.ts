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

    const { data: documento, error } = await supabase
      .from('documentos_garantia')
      .select('archivo_url, nombre_archivo, tipo_mime')
      .eq('solicitud_id', solicitudId)
      .maybeSingle()

    if (error || !documento?.archivo_url) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    const response = await fetch(documento.archivo_url)
    if (!response.ok) {
      return NextResponse.json({ error: 'Error al obtener el archivo' }, { status: 502 })
    }

    let contentType = documento.tipo_mime || response.headers.get('content-type') || 'application/octet-stream'
    const fileName = documento.nombre_archivo || 'documento_garantia'

    if (fileName.toLowerCase().endsWith('.pdf')) {
      contentType = 'application/pdf'
    }

    const contentDisposition = `inline; filename="${encodeURIComponent(fileName)}"`

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BUCKET = 'fichas-tecnicas'

function filePathFor(solicitudId: string, fileName: string) {
  return `fichas-tecnicas/${solicitudId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')}`
}

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
    const formData = await request.formData()
    const file = formData.get('archivo') as File | null
    const solicitudId = formData.get('solicitud_id') as string | null
    const laboratorioId = formData.get('laboratorio_id') as string | null
    const notas = formData.get('notas') as string | null

    if (!solicitudId) {
      return NextResponse.json({ error: 'solicitud_id es requerido' }, { status: 400 })
    }

    let archivo_url: string | null = null
    let nombre_archivo: string | null = null
    let tipo_mime: string | null = null
    let tamaño_bytes: number | null = null

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const fileBuffer = Buffer.from(bytes)
      const filePath = filePathFor(solicitudId, file.name)

      try {
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, fileBuffer, {
            contentType: file.type,
            upsert: true,
          })

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          return NextResponse.json({ error: 'Error al subir el archivo a storage' }, { status: 500 })
        }

        const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
        archivo_url = publicUrlData?.publicUrl || null
      } catch (storageError) {
        console.error('Storage exception:', storageError)
        return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
      }

      nombre_archivo = file.name
      tipo_mime = file.type
      tamaño_bytes = file.size
    }

    const { data, error } = await supabase
      .from('fichas_tecnicas')
      .insert({
        solicitud_id: solicitudId,
        laboratorio_id: laboratorioId || null,
        archivo_url,
        nombre_archivo,
        tipo_mime,
        tamaño_bytes,
        notas: notas || null,
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

export async function DELETE(request: NextRequest) {
  try {
    const fichaId = request.nextUrl.searchParams.get('id')
    if (!fichaId) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    const { data: existing, error: fetchError } = await supabase
      .from('fichas_tecnicas')
      .select('archivo_url, nombre_archivo')
      .eq('id', fichaId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching ficha tecnica:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (existing?.archivo_url) {
      try {
        const filePath = existing.archivo_url.split('/').slice(-2).join('/')
        await supabase.storage.from(BUCKET).remove([filePath])
      } catch (storageError) {
        console.error('Storage delete error:', storageError)
      }
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

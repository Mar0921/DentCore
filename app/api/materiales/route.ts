import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const laboratorioId = request.nextUrl.searchParams.get('laboratorio_id')
    console.log('GET /api/materiales - laboratorioId:', laboratorioId)
    if (!laboratorioId) {
      return NextResponse.json({ error: 'laboratorio_id es requerido' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('materiales')
      .select('*')
      .eq('laboratorio_id', laboratorioId)
      .order('created_at', { ascending: false })

    console.log('Supabase query result:', { data: data?.length, error })

    if (error) {
      console.error('Error fetching materiales:', error)
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
    const laboratorioId = formData.get('laboratorio_id') as string | null

    if (!laboratorioId) {
      return NextResponse.json({ error: 'laboratorio_id es requerido' }, { status: 400 })
    }

    const materialData: Record<string, any> = {}
    for (const [key, value] of formData.entries()) {
      if (key !== 'archivo' && key !== 'laboratorio_id') {
        materialData[key] = value
      }
    }
    materialData.laboratorio_id = laboratorioId

    let archivo_url: string | null = null
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const fileBuffer = Buffer.from(bytes)
      const ext = file.name.split('.').pop() || ''
      const filePath = `materiales/${laboratorioId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}.${ext}`

      try {
        const { error: uploadError } = await supabase.storage
          .from('solicitudes-documentos')
          .upload(filePath, fileBuffer, {
            contentType: file.type,
            upsert: true,
          })

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          return NextResponse.json({ error: 'Error al subir el archivo a storage' }, { status: 500 })
        }

        const { data: publicUrlData } = supabase.storage
          .from('solicitudes-documentos')
          .getPublicUrl(filePath)

        archivo_url = publicUrlData?.publicUrl || null
      } catch (storageError) {
        console.error('Storage exception:', storageError)
        return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
      }
    }

    materialData.archivo_url = archivo_url

    const { data, error } = await supabase
      .from('materiales')
      .insert(materialData)
      .select()
      .single()

    if (error) {
      console.error('Error inserting material:', error)
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
      .from('materiales')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating material:', error)
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
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    }

    const { error } = await supabase
      .from('materiales')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting material:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
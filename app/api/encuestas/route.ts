import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const solicitudId = request.nextUrl.searchParams.get('solicitud_id')
    if (!solicitudId) {
      return NextResponse.json({ error: 'solicitud_id es requerido' }, { status: 400 })
    }

    const { data: posData, error: posError } = await supabase
      .from('encuestas_pos_adaptacion')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .limit(1)
      .maybeSingle()

    const { data: buzonData, error: buzonError } = await supabase
      .from('buzon_quejas')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .limit(1)
      .maybeSingle()

    if (posError) {
      console.error('Error fetching encuesta posadaptacion:', posError)
    }
    if (buzonError) {
      console.error('Error fetching buzon quejas:', buzonError)
    }

    return NextResponse.json({
      posAdaptacion: posData || null,
      buzon: buzonData || null,
    }, { status: 200 })
  } catch (e) {
    console.error('Error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

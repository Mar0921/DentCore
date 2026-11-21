import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

type TrimestreRow = { trabajos: number; variacion: number }

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const anioActual = now.getFullYear()

    const trimestres: TrimestreRow[] = []

    for (let t = 1; t <= 4; t++) {
      const mesInicio = (t - 1) * 3 + 1
      const mesFin = t * 3
      const inicio = new Date(anioActual, mesInicio - 1, 1).toISOString()
      const fin = new Date(anioActual, mesFin, 0, 23, 59, 59).toISOString()

      const { count: trabajosActual } = await supabase
        .from('solicitudes')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', inicio)
        .lte('created_at', fin)

      const anioAnt = anioActual - 1
      const inicioAnt = new Date(anioAnt, mesInicio - 1, 1).toISOString()
      const finAnt = new Date(anioAnt, mesFin, 0, 23, 59, 59).toISOString()

      const { count: trabajosAnt } = await supabase
        .from('solicitudes')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', inicioAnt)
        .lte('created_at', finAnt)

      const actual = trabajosActual ?? 0
      const anterior = trabajosAnt ?? 0
      const variacion = anterior === 0 ? (actual > 0 ? 100 : 0) : Math.round(((actual - anterior) / anterior) * 100)

      trimestres.push({ trabajos: actual, variacion })
    }

    return NextResponse.json({ data: { trimestres } }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

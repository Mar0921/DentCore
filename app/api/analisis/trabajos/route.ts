import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const MESES_ES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
  7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
}

type Categoria = 'pendientes' | 'entregados' | 'otros'

function categorizarEstado(estado: string | null): Categoria {
  switch (estado) {
    case 'pendiente': return 'pendientes'
    case 'entregada': return 'entregados'
    default: return 'otros'
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data: solicitudes, error } = await supabase
      .from('solicitudes')
      .select('estado, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const mapa = new Map<string, { pendientes: number; entregados: number; otros: number; mesNum: number }>()

    solicitudes?.forEach((s) => {
      const fecha = new Date(s.created_at)
      const mesNum = fecha.getMonth() + 1
      const mes = MESES_ES[mesNum] || `Mes ${mesNum}`
      const cat = categorizarEstado(s.estado)

      if (!mapa.has(mes)) {
        mapa.set(mes, { pendientes: 0, entregados: 0, otros: 0, mesNum })
      }
      const entry = mapa.get(mes)!
      entry[cat]++
    })

    const entradasMensuales = Array.from(mapa.entries())
      .sort((a, b) => a[1].mesNum - b[1].mesNum)
      .map(([mes, v]) => ({
        mes,
        pendientes: v.pendientes,
        entregados: v.entregados,
        otros: v.otros,
      }))

    return NextResponse.json({ data: { entradasMensuales } }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

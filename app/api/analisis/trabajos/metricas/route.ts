import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const anioActual = now.getFullYear()
    const mesActual = now.getMonth() + 1

    // Inicio del mes actual
    const inicioMes = new Date(anioActual, mesActual - 1, 1).toISOString()
    // Fin del mes actual
    const finMes = new Date(anioActual, mesActual, 0, 23, 59, 59).toISOString()
    // Inicio del año actual
    const inicioAnio = new Date(anioActual, 0, 1).toISOString()

    // Mes anterior para variación
    const mesAnt = mesActual === 1 ? 12 : mesActual - 1
    const anioAntMes = mesActual === 1 ? anioActual - 1 : anioActual
    const inicioMesAnt = new Date(anioAntMes, mesAnt - 1, 1).toISOString()
    const finMesAnt = new Date(anioAntMes, mesAnt, 0, 23, 59, 59).toISOString()

    // Año anterior para variación
    const inicioAnioAnt = new Date(anioActual - 1, 0, 1).toISOString()
    const finAnioAnt = new Date(anioActual - 1, 11, 31, 23, 59, 59).toISOString()

    const [resMes, resMesAnt, resAnio, resAnioAnt] = await Promise.all([
      supabase.from('solicitudes').select('id', { count: 'exact', head: true }).gte('created_at', inicioMes).lte('created_at', finMes),
      supabase.from('solicitudes').select('id', { count: 'exact', head: true }).gte('created_at', inicioMesAnt).lte('created_at', finMesAnt),
      supabase.from('solicitudes').select('id', { count: 'exact', head: true }).gte('created_at', inicioAnio),
      supabase.from('solicitudes').select('id', { count: 'exact', head: true }).gte('created_at', inicioAnioAnt).lte('created_at', finAnioAnt),
    ])

    const trabajosEsteMes = resMes.count ?? 0
    const trabajosMesAnt = resMesAnt.count ?? 0
    const trabajosEsteAnio = resAnio.count ?? 0
    const trabajosAnioAnt = resAnioAnt.count ?? 0

    const variacionEsteMes = trabajosMesAnt === 0 ? (trabajosEsteMes > 0 ? 100 : 0) : Math.round(((trabajosEsteMes - trabajosMesAnt) / trabajosMesAnt) * 100)
    const variacionEsteAnio = trabajosAnioAnt === 0 ? (trabajosEsteAnio > 0 ? 100 : 0) : Math.round(((trabajosEsteAnio - trabajosAnioAnt) / trabajosAnioAnt) * 100)

    return NextResponse.json(
      {
        data: {
          trabajosEsteMes,
          variacionEsteMes,
          trabajosEsteAnio,
          variacionEsteAnio,
        },
      },
      { status: 200 },
    )
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

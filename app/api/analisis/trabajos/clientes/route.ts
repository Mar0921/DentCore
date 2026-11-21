import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

type ClienteRow = {
  codigo: string
  nombre: string
  trabajosAnio: number
  diferencia: number
}

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const anioActual = now.getFullYear()
    const mesActual = now.getMonth() + 1

    // Rango año actual (desde enero)
    const inicioAnio = new Date(anioActual, 0, 1).toISOString()
    // Rango año anterior para calcular diferencia
    const inicioAnioAnt = new Date(anioActual - 1, 0, 1).toISOString()
    const finAnioAnt = new Date(anioActual - 1, 11, 31, 23, 59, 59).toISOString()

    const { data: solicitudes, error } = await supabase
      .from('solicitudes')
      .select('odontologonombre, odontologo_id, estado, created_at')
      .gte('created_at', inicioAnio)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Agrupar por cliente (odontologonombre)
    const mapa = new Map<string, { id: string | null; nombre: string; count: number }>()

    solicitudes?.forEach((s) => {
      const nombre = s.odontologonombre || 'Sin asignar'
      const id = s.odontologo_id || null
      const clave = nombre

      if (!mapa.has(clave)) {
        mapa.set(clave, { id, nombre, count: 0 })
      }
      mapa.get(clave)!.count++
    })

    // Calcular año anterior por cliente para diferencia
    const { data: solicitudesAnt } = await supabase
      .from('solicitudes')
      .select('odontologonombre, created_at')
      .gte('created_at', inicioAnioAnt)
      .lte('created_at', finAnioAnt)

    const mapaAnt = new Map<string, number>()
    solicitudesAnt?.forEach((s) => {
      const nombre = s.odontologonombre || 'Sin asignar'
      mapaAnt.set(nombre, (mapaAnt.get(nombre) || 0) + 1)
    })

    const clientes: ClienteRow[] = Array.from(mapa.entries())
      .map(([nombre, v]) => {
        const ant = mapaAnt.get(nombre) || 0
        const diferencia = ant === 0 ? (v.count > 0 ? 100 : 0) : Math.round(((v.count - ant) / ant) * 100)
        return {
          codigo: String(v.id ?? ''),
          nombre: v.nombre,
          trabajosAnio: v.count,
          diferencia,
        }
      })
      .sort((a, b) => b.trabajosAnio - a.trabajosAnio)

    const total = clientes.reduce((acc, c) => acc + c.trabajosAnio, 0)

    // Top 5 + Otros
    const top = clientes.slice(0, 5)
    const otrosCount = clientes.slice(5).reduce((acc, c) => acc + c.trabajosAnio, 0)
    const otrosDif = clientes.slice(5).reduce((acc, c) => acc + c.diferencia, 0) / Math.max(clientes.slice(5).length, 1)

    const resultado: ClienteRow[] = [
      ...top,
      {
        codigo: '',
        nombre: 'Otros',
        trabajosAnio: otrosCount,
        diferencia: Math.round(otrosDif),
      },
    ]

    return NextResponse.json(
      { data: { clientes: resultado, total } },
      { status: 200 },
    )
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

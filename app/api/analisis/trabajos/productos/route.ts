import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

type ProductoRow = {
  nombre: string
  unidadesAnio: number
  diferencia: number
}

function parseProductos(texto: string | null): { nombre: string; cantidad: number }[] {
  if (!texto) return []
  return texto
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const match = p.match(/^(.*?)\s*x\s*(\d+)\s*\(/i)
      if (match) {
        return { nombre: match[1].trim(), cantidad: parseInt(match[2], 10) || 1 }
      }
      return { nombre: p, cantidad: 1 }
    })
}

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const anioActual = now.getFullYear()

    const inicioAnio = new Date(anioActual, 0, 1).toISOString()
    const inicioAnioAnt = new Date(anioActual - 1, 0, 1).toISOString()
    const finAnioAnt = new Date(anioActual - 1, 11, 31, 23, 59, 59).toISOString()

    const { data: solicitudes, error } = await supabase
      .from('solicitudes')
      .select('productos, created_at')
      .gte('created_at', inicioAnio)
      .not('productos', 'is', null)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const mapa = new Map<string, number>()

    solicitudes?.forEach((s) => {
      parseProductos(s.productos).forEach(({ nombre, cantidad }) => {
        mapa.set(nombre, (mapa.get(nombre) || 0) + cantidad)
      })
    })

    const { data: solicitudesAnt } = await supabase
      .from('solicitudes')
      .select('productos, created_at')
      .gte('created_at', inicioAnioAnt)
      .lte('created_at', finAnioAnt)
      .not('productos', 'is', null)

    const mapaAnt = new Map<string, number>()
    solicitudesAnt?.forEach((s) => {
      parseProductos(s.productos).forEach(({ nombre, cantidad }) => {
        mapaAnt.set(nombre, (mapaAnt.get(nombre) || 0) + cantidad)
      })
    })

    const productos: ProductoRow[] = Array.from(mapa.entries())
      .map(([nombre, count]) => {
        const ant = mapaAnt.get(nombre) || 0
        const diferencia = ant === 0 ? (count > 0 ? 100 : 0) : Math.round(((count - ant) / ant) * 100)
        return { nombre, unidadesAnio: count, diferencia }
      })
      .sort((a, b) => b.unidadesAnio - a.unidadesAnio)

    const total = productos.reduce((acc, p) => acc + p.unidadesAnio, 0)

    const top = productos.slice(0, 5)
    const otrosCount = productos.slice(5).reduce((acc, p) => acc + p.unidadesAnio, 0)
    const otrosDif = productos.slice(5).reduce((acc, p) => acc + p.diferencia, 0) / Math.max(productos.slice(5).length, 1)

    const resultado: ProductoRow[] = [
      ...top,
      {
        nombre: 'Otros',
        unidadesAnio: otrosCount,
        diferencia: Math.round(otrosDif),
      },
    ]

    return NextResponse.json(
      { data: { productos: resultado, total } },
      { status: 200 },
    )
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

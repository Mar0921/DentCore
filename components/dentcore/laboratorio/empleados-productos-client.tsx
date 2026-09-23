'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Package, Clock, User, AlertCircle } from 'lucide-react'
import { FASES_PROCESO } from '@/data/fases-data'

interface Producto {
  id: string
  titulo: string
  nombre: string
  description: string
  material: string
  categoria: string
  precio: number
  activo: boolean
}

interface FaseRow {
  id: string
  nombre: string
  orden: number
  color: string
  descripcion: string
  empleado_id?: string | null
}

interface ProductoFase {
  producto_id: string
  fase_id: string
  orden: number
}

interface Empleado {
  id: string
  nombre: string
}

function getColorClass(color?: string | null): string {
  if (!color) return 'bg-secondary/30 text-secondary-foreground'
  if (color.startsWith('bg-')) return color
  return 'bg-secondary/30 text-secondary-foreground'
}

export function EmpleadosProductosClient() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [fases, setFases] = useState<Record<string, FaseRow>>({})
  const [productFases, setProductFases] = useState<ProductoFase[]>([])
  const [empleados, setEmpleados] = useState<Record<string, Empleado>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const { data: labData } = await supabase
        .from('laboratorio')
        .select('id, nombre')
        .limit(1)
      const labId = labData && labData.length > 0 ? labData[0].id : null

      const { data: productosData, error: prodError } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('titulo', { ascending: true })

      if (prodError) {
        console.error('Error loading productos:', prodError)
      }
      const activeProductos = (productosData || []) as Producto[]
      setProductos(activeProductos)

      const { data: fasesData, error: fasesError } = await supabase
        .from('fases')
        .select('*')
        .order('orden', { ascending: true })

      if (fasesError) {
        console.error('Error loading fases:', fasesError)
      }
      const fasesMap: Record<string, FaseRow> = {}
      ;(fasesData || []).forEach((f: any) => {
        fasesMap[f.id] = {
          id: f.id,
          nombre: f.nombre || '',
          orden: f.orden || 0,
          color: f.color || '',
          descripcion: f.descripcion || '',
          empleado_id: f.empleado_id || null,
        }
      })
      setFases(fasesMap)

      if (activeProductos.length > 0) {
        const { data: pfData } = await supabase
          .from('producto_fases')
          .select('producto_id, fase_id, orden')
          .in('producto_id', activeProductos.map(p => p.id))
          .order('orden', { ascending: true })

        setProductFases((pfData || []) as ProductoFase[])
      }

      const { data: empleadosData, error: empleadosError } = await supabase
        .from('empleados')
        .select('id, nombre')

      if (!empleadosError && empleadosData) {
        const empMap: Record<string, Empleado> = {}
        empleadosData.forEach((emp: any) => {
          empMap[emp.id] = { id: emp.id, nombre: emp.nombre || '' }
        })
        setEmpleados(empMap)
      }
    } catch (err: any) {
      setError(err?.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  function getFasesForProducto(productoId: string): FaseRow[] {
    const rels = productFases
      .filter(pf => pf.producto_id === productoId)
      .sort((a, b) => a.orden - b.orden)

    return rels
      .map(pf => fases[pf.fase_id])
      .filter(Boolean)
      .map((fase, index) => ({
        ...fase,
        orden: index + 1,
      }))
  }

  function getEmpleadoNombre(empleadoId?: string | null): string {
    if (!empleadoId) return 'Sin asignar'
    return empleados[empleadoId]?.nombre || empleadoId
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Productos del Laboratorio</h1>
        <p className="text-sm text-muted-foreground">
          Productos activos y sus fases de elaboración
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-5 w-3/4 animate-pulse rounded bg-secondary" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="size-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      ) : productos.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto size-12 mb-2 opacity-50" />
              <p>No hay productos activos en el laboratorio.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {productos.map((prod) => {
            const productoFases = getFasesForProducto(prod.id)
            const titulo = prod.titulo || prod.nombre || 'Sin nombre'
            return (
              <Card key={prod.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="size-4 text-primary" />
                    {titulo}
                  </CardTitle>
                  {prod.description && (
                    <CardDescription className="line-clamp-2">
                      {prod.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 text-xs mb-3">
                    {prod.categoria && (
                      <span className="px-2 py-0.5 rounded bg-secondary">{prod.categoria}</span>
                    )}
                    {prod.material && (
                      <span className="px-2 py-0.5 rounded bg-secondary">{prod.material}</span>
                    )}
                  </div>

                  {productoFases.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin fases definidas para este producto.</p>
                  ) : (
                    <div className="space-y-2">
                      {productoFases.map((fase) => (
                        <div
                          key={`${prod.id}-${fase.id}`}
                          className={`flex items-center gap-3 rounded-lg border p-3 ${getColorClass(fase.color)}`}
                        >
                          <div className="flex size-7 items-center justify-center rounded-full bg-foreground/10 shrink-0">
                            <Clock className="size-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs">
                                #{fase.orden} · {fase.nombre}
                              </span>
                            </div>
                            {fase.descripcion && (
                              <p className="text-xs text-muted-foreground/80 mt-0.5">
                                {fase.descripcion}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <User className="size-3 text-muted-foreground/70" />
                            <span className="text-xs text-muted-foreground">
                              {getEmpleadoNombre(fase.empleado_id)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}



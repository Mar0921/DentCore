'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Search, FileText, AlertCircle } from 'lucide-react'
import { FASES_PROCESO } from '@/data/fases-data'
import type { Fase, Empleado } from '@/types/laboratorio'

interface FaseConEmpleado extends Fase {
  orden: number
}

const STORAGE_KEY = 'fases_asignaciones'

export function FasesPageClient() {
  const [fases, setFases] = useState<FaseConEmpleado[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingEmpleados, setLoadingEmpleados] = useState(true)
  const [columnaEmpleadoSoportada, setColumnaEmpleadoSoportada] = useState<boolean | null>(null)
  const [asignacionesLocales, setAsignacionesLocales] = useState<Record<string, string>>({})
  const [labId, setLabId] = useState<string | null>(null)
  const [labNombre, setLabNombre] = useState<string>('')

  useEffect(() => {
    loadLaboratorio().then((id) => {
      loadFases(id)
      loadEmpleados()
    })
  }, [])

  async function loadLaboratorio() {
    try {
      const { data } = await supabase.from('laboratorio').select('id, nombre').limit(1)
      if (data && data.length > 0) {
        setLabId(data[0].id)
        setLabNombre(data[0].nombre || '')
        return data[0].id
      }
    } catch (err) {
      console.error('Error:', err)
    }
    return null
  }

  async function probeEmpleadoIdColumn() {
    const { error } = await supabase.from('fases').select('empleado_id').limit(1)
    const soportada = !error || !String(error.message).includes('empleado_id')
    setColumnaEmpleadoSoportada(soportada)
  }

  async function loadFases(labIdParam: string | null) {
    setLoading(true)
    let dbFases: any[] = []
    try {
    let query = supabase.from('fases').select('*').order('orden', { ascending: true })
    if (labIdParam) {
      query = query.eq('laboratorio_id', labIdParam)
    }
    const { data, error } = await query
    if (error) {
      console.warn('fases table not available:', error.message)
    } else if (data && data.length > 0) {
      dbFases = data
    }
    } catch (err) {
      console.error('Error:', err)
    }

    await probeEmpleadoIdColumn()

    const dbByNombre: Record<string, any> = {}
    dbFases.forEach((f: any) => {
      dbByNombre[f.nombre] = f
    })

    const local = loadAsignacionesLocales()

    const merged = FASES_PROCESO.map((faseDef) => {
      const db = dbByNombre[faseDef.nombre]
      const empleadoId =
        columnaEmpleadoSoportada === false
          ? local[faseDef.nombre]
          : db?.empleado_id || local[faseDef.nombre]
      return {
        id: db?.id || '',
        nombre: faseDef.nombre,
        orden: faseDef.orden,
        color: db?.color || faseDef.color || 'bg-secondary/30 text-secondary-foreground',
        descripcion: db?.descripcion || faseDef.descripcion || '',
        empleado_id: empleadoId || null,
        empleado_nombre: empleados.find((e) => e.id === empleadoId)?.nombre || null,
      }
    })

    setFases(merged)
    setAsignacionesLocales(local)
    setLoading(false)
  }

  async function loadEmpleados() {
    setLoadingEmpleados(true)
    try {
      const { data, error } = await supabase
        .from('empleados')
        .select('id, nombre, email, rol')
        .order('nombre', { ascending: true })
      if (!error && data) setEmpleados(data as Empleado[])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoadingEmpleados(false)
    }
  }

  function loadAsignacionesLocales(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    } catch {
      return {}
    }
  }

  function saveAsignacionesLocales(map: Record<string, string>) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  }

  async function assignEmpleado(faseNombre: string, empleadoId: string) {
    const faseRow = fases.find((f) => f.nombre === faseNombre)
    const emp = empleados.find((e) => e.id === empleadoId)

    const optimistic = fases.map((f) =>
      f.nombre === faseNombre
        ? {
            ...f,
            empleado_id: empleadoId || null,
            empleado_nombre: emp?.nombre || null,
          }
        : f,
    )
    setFases(optimistic)

    setAsignacionesLocales((prev) => {
      const next = { ...prev, [faseNombre]: empleadoId || '' }
      if (!empleadoId) delete next[faseNombre]
      saveAsignacionesLocales(next)
      return next
    })

    if (columnaEmpleadoSoportada && faseRow) {
      try {
        const { data: existing, error: findErr } = await supabase
          .from('fases')
          .select('id')
          .eq('nombre', faseNombre)
          .eq('laboratorio_id', labId)
          .maybeSingle()
        if (findErr) throw findErr

        const payload: any = {
          nombre: faseNombre,
          orden: faseRow.orden,
          color: faseRow.color || '',
          descripcion: faseRow.descripcion || '',
          laboratorio_id: labId,
          empleado_id: empleadoId || null,
        }

        if (existing) {
          const { error } = await supabase
            .from('fases')
            .update({
              empleado_id: empleadoId || null,
              orden: faseRow.orden,
              color: faseRow.color || '',
              descripcion: faseRow.descripcion || '',
            })
            .eq('id', existing.id)
          if (error) throw error
        } else {
          const { error } = await supabase.from('fases').insert(payload)
          if (error) throw error
        }
      } catch (err: any) {
        if (String(err?.message).includes('empleado_id')) {
          setColumnaEmpleadoSoportada(false)
        }
        console.warn('No se pudo persistir la asignación en la base de datos:', err?.message)
      }
    }
  }

  const filtered = useMemo(() => {
    if (!search) return fases
    const term = search.toLowerCase()
    return fases.filter(
      (f) =>
        f.nombre.toLowerCase().includes(term) ||
        (f.empleado_nombre || '').toLowerCase().includes(term),
    )
  }, [fases, search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">
          Fases de {labNombre ? `Laboratorio ${labNombre}` : 'Laboratorio'}
        </h1>
        <p className="text-sm text-muted-foreground">Etapas del proceso productivo y asignación de empleados</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar fase..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-5 w-3/4 animate-pulse rounded bg-secondary" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proceso productivo</CardTitle>
            <CardDescription>{filtered.length} de {fases.length} fases</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fase</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Empleado asignado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((fase) => (
                    <tr key={fase.nombre} className="transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-3 text-muted-foreground">{fase.orden}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{fase.nombre}</span>
                      </td>
                      <td className="px-4 py-3 min-w-56">
                        {loadingEmpleados ? (
                          <span className="text-xs text-muted-foreground">Cargando...</span>
                        ) : (
                          <select
                            className="w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                            value={fase.empleado_id || ''}
                            onChange={(e) => assignEmpleado(fase.nombre, e.target.value)}
                          >
                            <option value="">Sin asignar</option>
                            {empleados.map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.nombre} {emp.email ? `(${emp.email})` : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                  <FileText className="mx-auto size-12 mb-2 opacity-50" />
                  <p>No se encontraron fases con ese criterio.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {columnaEmpleadoSoportada === false && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            La columna <code className="rounded bg-amber-100 px-1">empleado_id</code> no existe en la tabla
            <code className="rounded bg-amber-100 px-1"> fases</code>. La asignación se guarda localmente en este
            navegador. Ejecuta <code className="rounded bg-amber-100 px-1">npx tsx setup_fases.ts</code> o aplica la
            migración <code className="rounded bg-amber-100 px-1">supabase/migrations/20260917_add_empleado_id_a_fases.sql</code>{' '}
            para persistirla en la base de datos.
          </span>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Search, FileText, AlertCircle, Plus, Eye, EyeOff } from 'lucide-react'
import { FASES_PROCESO } from '@/data/fases-data'
import type { Fase, Empleado } from '@/types/laboratorio'

interface FaseConEmpleado extends Fase {
  orden: number
}

const STORAGE_KEY = 'fases_asignaciones'

export function FasesPageClient({ modo = 'admin' }: { modo?: 'admin' | 'empleado' }) {
  const [fases, setFases] = useState<FaseConEmpleado[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingEmpleados, setLoadingEmpleados] = useState(true)
  const [columnaEmpleadoSoportada, setColumnaEmpleadoSoportada] = useState<boolean | null>(null)
  const [asignacionesLocales, setAsignacionesLocales] = useState<Record<string, string>>({})
  const [labId, setLabId] = useState<string | null>(null)
  const [labNombre, setLabNombre] = useState<string>('')
  const [newPhaseName, setNewPhaseName] = useState('')
  const [creating, setCreating] = useState(false)
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadLaboratorio().then((id) => {
      if (id) {
        try { setHidden(new Set(JSON.parse(localStorage.getItem(`fases_ocultas_${id}`) || '[]'))) } catch {}
      }
      loadFases(id)
      loadEmpleados(id)
    })
  }, [])

  async function loadLaboratorio() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      let email = user?.email || (typeof window !== 'undefined' ? localStorage.getItem('labUserEmail') : null)
      let lab: any = null
      if (email) {
        const { data: labs } = await supabase.from('laboratorio').select('id, nombre').eq('email', email).limit(1)
        lab = labs?.[0]
        if (!lab) {
          const { data: emps } = await supabase.from('empleados').select('laboratorio_id').eq('email', email).limit(1)
          const labIdEmp = emps?.[0]?.laboratorio_id
          if (labIdEmp) {
            const { data: labs2 } = await supabase.from('laboratorio').select('id, nombre').eq('id', labIdEmp).limit(1)
            lab = labs2?.[0]
          }
        }
      }
      if (!lab) {
        const { data } = await supabase.from('laboratorio').select('id, nombre').limit(1)
        lab = data?.[0]
      }
      if (lab) {
        setLabId(lab.id)
        setLabNombre(lab.nombre || '')
        return lab.id
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

    const predefinedNames = new Set(FASES_PROCESO.map((f) => f.nombre))
    const extras = dbFases
      .filter((f: any) => !predefinedNames.has(f.nombre))
      .map((f: any) => {
        const empleadoId =
          columnaEmpleadoSoportada === false ? local[f.nombre] : f.empleado_id || local[f.nombre]
        return {
          id: f.id || '',
          nombre: f.nombre,
          orden: f.orden ?? 999,
          color: f.color || 'bg-secondary/30 text-secondary-foreground',
          descripcion: f.descripcion || '',
          empleado_id: empleadoId || null,
          empleado_nombre: empleados.find((e) => e.id === empleadoId)?.nombre || null,
        }
      })

    const all = [...merged, ...extras]
    setFases(all.filter((f) => !hidden.has(f.nombre)))
    setAsignacionesLocales(local)
    setLoading(false)
  }

  async function loadEmpleados(labIdParam: string | null) {
    setLoadingEmpleados(true)
    try {
      let query = supabase
        .from('empleados')
        .select('id, nombre, email, rol, departamento, telefono, activo, laboratorio_id')
        .order('nombre', { ascending: true })
      if (labIdParam) {
        query = query.eq('laboratorio_id', labIdParam)
      }
      const { data, error } = await query
      if (!error && data) {
        setEmpleados(data as Empleado[])
      } else if (error) {
        const msg = String(error.message || '')
        if (msg.includes('laboratorio_id')) {
          // Column doesn't exist yet — fall back to loading all employees
          const fallback = await supabase
            .from('empleados')
            .select('id, nombre, email, rol, departamento, telefono, activo')
            .order('nombre', { ascending: true })
          if (fallback.data) setEmpleados(fallback.data as Empleado[])
        } else {
          console.error('Error cargando empleados:', error)
        }
      }
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

  async function createPhase() {
    const nombre = newPhaseName.trim()
    if (!nombre || !labId) return
    setCreating(true)
    try {
      const { error } = await supabase.from('fases').insert({
        nombre,
        orden: fases.length + 1,
        color: 'bg-secondary/30 text-secondary-foreground',
        descripcion: '',
        laboratorio_id: labId,
      })
      if (error) throw error
      setNewPhaseName('')
      await loadFases(labId)
    } catch (err) {
      console.error('Error creando fase:', err)
    } finally {
      setCreating(false)
    }
  }

  function toggleHide(nombre: string) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(nombre)) { next.delete(nombre) } else { next.add(nombre) }
      if (labId) localStorage.setItem(`fases_ocultas_${labId}`, JSON.stringify([...next]))
      return next
    })
  }

  const filtered = useMemo(() => {
    const isHidden = (name: string) => modo === 'empleado' ? hidden.has(name) : false
    if (!search) return fases.filter((f) => !isHidden(f.nombre))
    const term = search.toLowerCase()
    return fases.filter(
      (f) =>
        !isHidden(f.nombre) &&
        (f.nombre.toLowerCase().includes(term) ||
        (f.empleado_nombre || '').toLowerCase().includes(term)),
    )
  }, [fases, search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">
          {modo === 'empleado'
            ? 'Fases del proceso'
            : `Fases de ${labNombre ? `Laboratorio ${labNombre}` : 'Laboratorio'}`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {modo === 'empleado'
            ? 'Lista de fases y empleados asignados'
            : 'Etapas del proceso productivo y asignación de empleados'}
        </p>
      </div>

      {modo !== 'empleado' && (
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="Nueva fase..."
            value={newPhaseName}
            onChange={(e) => setNewPhaseName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createPhase() }}
            className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
          <button
            onClick={createPhase}
            disabled={creating || !newPhaseName.trim()}
            className="h-10 inline-flex items-center gap-1 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Plus className="size-4" />
            Agregar
          </button>
        </div>
      )}

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
             <CardDescription>
              {modo === 'empleado'
                ? `${fases.length} fases del proceso`
                : `${filtered.length} de ${fases.length} fases`}
            </CardDescription>
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
                  {filtered.map((fase) => {
                    const emp = empleados.find((e) => e.id === fase.empleado_id)
                    return (
                    <tr key={fase.nombre} className="transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-3 text-muted-foreground">{fase.orden}</td>
                       <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{fase.nombre}</span>
                          {modo !== 'empleado' && (
                            <button
                              onClick={() => toggleHide(fase.nombre)}
                              className="text-muted-foreground hover:text-foreground"
                              title={hidden.has(fase.nombre) ? 'Mostrar' : 'Ocultar'}
                            >
                              {hidden.has(fase.nombre) ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-56">
                        {modo === 'empleado' ? (
                          <span className="text-sm text-foreground">
                            {emp?.nombre || 'Sin asignar'}
                          </span>
                        ) : loadingEmpleados ? (
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
                    )
                  })}
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

      {modo !== 'empleado' && columnaEmpleadoSoportada === false && (
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

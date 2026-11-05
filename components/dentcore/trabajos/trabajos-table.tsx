'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Edit, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useLabUser } from '@/hooks/use-lab-user'
import type { Trabajo, TrabajoTab } from '@/types/trabajo'

const tabConfig: { key: TrabajoTab; label: string }[] = [
  { key: 'en_curso', label: 'Trabajos en curso' },
  { key: 'deben_salir_hoy', label: 'Deben salir hoy' },
  { key: 'retrasados', label: 'Retrasados' },
  { key: 'estado_ejecucion', label: 'Estado ejecución' },
]

const estadoConfig: Record<string, { label: string; color: string }> = {
  en_laboratorio: { label: 'En laboratorio', color: 'bg-accent/15 text-accent' },
  en_proceso: { label: 'En proceso', color: 'bg-primary/10 text-primary' },
  listo: { label: 'Listo', color: 'bg-accent/15 text-accent' },
  entregado: { label: 'Entregado', color: 'bg-accent/15 text-accent' },
  retrasado: { label: 'Retrasado', color: 'bg-destructive/10 text-destructive' },
  pendiente: { label: 'Pendiente', color: 'bg-secondary/50 text-secondary-foreground' },
}

const ESTADO_MAP: Record<string, Trabajo['estado']> = {
  pendiente: 'en_laboratorio',
  en_laboratorio: 'en_laboratorio',
  en_proceso: 'en_proceso',
  progreso: 'en_proceso',
  listo: 'listo',
  terminado: 'listo',
  completado: 'listo',
  entregado: 'entregado',
  cancelado: 'retrasado',
  retrasado: 'retrasado',
}

interface AvanceSolicitud {
  total: number
  completadas: number
  progreso: number
  ultimaFase: string | null
}

function normalize(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function nombresProductos(productos?: string | null): string[] {
  const nombres: string[] = []
  for (const raw of (productos || '').split(';').map((p) => p.trim()).filter(Boolean)) {
    const m = raw.match(/^(.*?)\s+x(\d+)\s*\(([^)]*)\)/i)
    const nombre = (m ? m[1] : raw).trim()
    if (!nombres.some((n) => normalize(n) === normalize(nombre))) nombres.push(nombre)
  }
  return nombres
}

function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  const str = String(dateStr)

  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy
    const d = new Date(Number(year), Number(month) - 1, Number(day))
    if (!isNaN(d.getTime())) return d
  }

  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    const d = new Date(Number(year), Number(month) - 1, Number(day))
    if (!isNaN(d.getTime())) return d
  }

  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function formatDateToDDMMYYYY(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-'
  if (dateStr instanceof Date) {
    const d = dateStr
    if (isNaN(d.getTime())) return '-'
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }
  const d = parseDate(dateStr)
  if (!d) return typeof dateStr === 'string' ? dateStr : '-'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function extractTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const date = parseDate(dateStr)
  if (!date) return '-'
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

function isOverdue(fechaEntrega: string | null | undefined, estado: string): boolean {
  if (!fechaEntrega) return false
  const entrega = parseDate(fechaEntrega)
  if (!entrega) return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  entrega.setHours(0, 0, 0, 0)
  return now > entrega && !['entregado', 'completado', 'cancelado'].includes(estado)
}

async function loadFasesMap(labId: string | null): Promise<Record<string, string>> {
  let query = supabase.from('fases').select('id, nombre, orden').order('orden', { ascending: true })
  if (labId) {
    query = query.eq('laboratorio_id', labId)
  }
  const { data, error } = await query
  if (error || !data) return {}
  const map: Record<string, string> = {}
  data.forEach((f: any) => {
    if (f.id) map[f.id] = f.nombre || ''
  })
  return map
}

export function TrabajosTable({ empleado = false }: { empleado?: boolean }) {
  const router = useRouter()
  const { labName } = useLabUser()
  const [activeTab, setActiveTab] = useState<TrabajoTab>('en_curso')
  const [search, setSearch] = useState('')
  const [trabajos, setTrabajos] = useState<Trabajo[]>([])
  const [clienteIdMap, setClienteIdMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [catalogoProductos, setCatalogoProductos] = useState<{ id: string; titulo: string | null; nombre: string | null }[]>([])
  const [productoFases, setProductoFases] = useState<{ id: string; producto_id: string; fase_id: string | null }[]>([])
  const [avanceFilas, setAvanceFilas] = useState<{ solicitud_id: string; producto_fase_id: string; estado: string | null; created_at: string | null; fecha_finalizacion: string | null }[]>([])
  const [fasesNombre, setFasesNombre] = useState<Record<string, string>>({})
  const [fasesOrden, setFasesOrden] = useState<Record<string, number>>({})
  const [avanceListo, setAvanceListo] = useState(false)

  useEffect(() => {
    loadTrabajos()
  }, [])

  useEffect(() => {
    let cancelled = false
    async function fetchAvance() {
      try {
        // Consultas base: exactamente las mismas columnas que usa Solicitudes (el progreso depende de estas)
        const [prod, rel, av] = await Promise.all([
          supabase.from('productos').select('id, titulo, nombre'),
          supabase.from('producto_fases').select('id, producto_id'),
          supabase.from('solicitud_fases').select('solicitud_id, producto_fase_id, estado'),
        ])
        const baseError = prod.error || rel.error || av.error
        if (baseError) throw baseError

        // Consultas extra (solo para "Fase actual"): si fallan, el progreso igual se calcula
        const [relFase, avFechas, fas] = await Promise.all([
          supabase.from('producto_fases').select('id, fase_id'),
          supabase.from('solicitud_fases').select('solicitud_id, producto_fase_id, fecha_finalizacion'),
          supabase.from('fases').select('id, nombre, orden'),
        ])
        if (relFase.error) console.warn('producto_fases.fase_id:', relFase.error.message)
        if (avFechas.error) console.warn('solicitud_fases fechas:', avFechas.error.message)
        if (fas.error) console.warn('fases:', fas.error.message)
        if (cancelled) return

        const faseIdPorPF: Record<string, string | null> = {}
        ;((relFase.data as any[]) || []).forEach((r) => {
          faseIdPorPF[r.id] = r.fase_id ?? null
        })
        const fechasPorClave: Record<string, { created_at: string | null; fecha_finalizacion: string | null }> = {}
        ;((avFechas.data as any[]) || []).forEach((r) => {
          const k = `${r.solicitud_id}|${r.producto_fase_id}`
          const prev = fechasPorClave[k]
          if (!prev || (r.fecha_finalizacion && (!prev.fecha_finalizacion || r.fecha_finalizacion > prev.fecha_finalizacion))) {
            fechasPorClave[k] = { created_at: r.created_at ?? null, fecha_finalizacion: r.fecha_finalizacion ?? null }
          }
        })
        const nombres: Record<string, string> = {}
        const ordenes: Record<string, number> = {}
        ;((fas.data as any[]) || []).forEach((f) => {
          if (f.id) {
            nombres[f.id] = f.nombre || ''
            if (typeof f.orden === 'number') ordenes[f.id] = f.orden
          }
        })

        setCatalogoProductos((prod.data as any[]) || [])
        setProductoFases(((rel.data as any[]) || []).map((r) => ({ ...r, fase_id: faseIdPorPF[r.id] ?? null })))
        setAvanceFilas(
          ((av.data as any[]) || []).map((r) => {
            const extra = fechasPorClave[`${r.solicitud_id}|${r.producto_fase_id}`]
            return { ...r, created_at: extra?.created_at ?? null, fecha_finalizacion: extra?.fecha_finalizacion ?? null }
          }),
        )
        setFasesNombre(nombres)
        setFasesOrden(ordenes)
        setAvanceListo(true)
      } catch (e) {
        console.error('Error cargando el avance:', e)
      }
    }
    fetchAvance()
    return () => {
      cancelled = true
    }
  }, [])

  async function loadTrabajos() {
    setLoading(true)
    setError(null)
    try {
      const { data: labs } = await supabase.from('laboratorio').select('id').limit(1)
      const labId = labs && labs[0]?.id || null
      const fasesMap = await loadFasesMap(labId)

      const { data, error: fetchError } = await supabase
        .from('solicitudes')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const mapped: Trabajo[] = (data || []).map((s: any) => {
        const dbEstado = s.estado || 'pendiente'
        let uiEstado = ESTADO_MAP[dbEstado] || dbEstado
        if (isOverdue(s.fecha_entrega, dbEstado)) {
          uiEstado = 'retrasado'
        }

        const fechaEntrega = s.fecha_entrega || s.fechaEntrega || null
        return {
          id: s.id,
          codigo: s.codigo_trazabilidad || s.codigo || s.id?.substring(0, 14) || '—',
          estado: uiEstado as Trabajo['estado'],
          caja: s.caja || '-',
          cliente: s.odontologonombre || s.cliente || s.nombre_cliente || '—',
          clienteCodigo: '-',
          doctor: s.odontologonombre || '',
          paciente: s.paciente || 'Sin paciente',
          faseActual: (s.fase_id && fasesMap[s.fase_id]) || s.faseActual || s.fase_actual || '—',
          fechaEntrega: formatDateToDDMMYYYY(fechaEntrega),
          horaEntrega: extractTime(fechaEntrega) || '-',
          productos: s.productos ?? null,
        } as Trabajo
      })

      const { data: clientesData } = await supabase
        .from('cliente')
        .select('id, nombre')
      const idMap: Record<string, string> = {}
      ;(clientesData || []).forEach((c: any) => {
        if (c.nombre && c.id && !(c.nombre in idMap)) idMap[c.nombre] = c.id
      })
      setClienteIdMap(idMap)

      setTrabajos(mapped)
    } catch (err: any) {
      setError(err?.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Avance por solicitud: fases completadas / fases de sus productos, y última fase agregada
  const avancePorSolicitud = useMemo(() => {
    const result: Record<string, AvanceSolicitud> = {}
    if (!avanceListo) return result

    const filasPorSolicitud: Record<string, typeof avanceFilas> = {}
    avanceFilas.forEach((f) => {
      ;(filasPorSolicitud[f.solicitud_id] ||= []).push(f)
    })
    const faseIdPorProductoFase = new Map(productoFases.map((pf) => [pf.id, pf.fase_id]))

    trabajos.forEach((t) => {
      const nombres = nombresProductos(t.productos).map(normalize)
      // Igual que en Solicitudes: coincide por título O por nombre
      const productoIds = nombres
        .map((n) =>
          catalogoProductos.find((p) => (n !== '' && normalize(p.titulo) === n) || (n !== '' && normalize(p.nombre) === n)),
        )
        .filter((p): p is NonNullable<typeof p> => !!p)
        .map((p) => p.id)
      const pfIds = new Set(
        productoFases.filter((pf) => productoIds.includes(pf.producto_id)).map((pf) => pf.id),
      )

      const filas = filasPorSolicitud[t.id] || []
      const completadas = new Set(
        filas
          .filter((f) => ['completada', 'completado'].includes(normalize(f.estado)) && pfIds.has(f.producto_fase_id))
          .map((f) => f.producto_fase_id),
      ).size
      const total = pfIds.size

       // Fase actual = la última fase finalizada (fecha de finalización más reciente); desempata el orden de fase
       const filasCompletas = filas.filter(
         (f) => pfIds.has(f.producto_fase_id) && ['completada', 'completado'].includes(normalize(f.estado)),
       )
       const ordenDe = (f: (typeof filasCompletas)[number]) => {
         const fid = faseIdPorProductoFase.get(f.producto_fase_id)
         return fid != null && fasesOrden[fid] != null ? fasesOrden[fid] : -1
       }
       const ultima = [...filasCompletas].sort((a, b) => {
         const d =
           (b.fecha_finalizacion ? new Date(b.fecha_finalizacion).getTime() : 0) -
           (a.fecha_finalizacion ? new Date(a.fecha_finalizacion).getTime() : 0)
         if (d !== 0) return d
         return ordenDe(b) - ordenDe(a)
       })[0]
       const faseId = ultima ? faseIdPorProductoFase.get(ultima.producto_fase_id) : null
       const ultimaFase = (faseId && fasesNombre[faseId]) || null

      result[t.id] = {
        total,
        completadas,
        progreso: total > 0 ? Math.round((completadas / total) * 100) : 0,
        ultimaFase,
      }
    })
    return result
  }, [trabajos, catalogoProductos, productoFases, avanceFilas, fasesNombre, fasesOrden, avanceListo])

  const filtered = useMemo(() => {
    return trabajos.filter((t) => {
      if (activeTab === 'en_curso') {
        if (!['en_laboratorio', 'en_proceso'].includes(t.estado)) return false
      } else if (activeTab === 'deben_salir_hoy') {
        const todayStr = formatDateToDDMMYYYY(new Date())
        if (t.fechaEntrega !== todayStr) return false
        if (t.estado === 'entregado') return false
      } else if (activeTab === 'retrasados') {
        if (t.estado !== 'retrasado') return false
      } else if (activeTab === 'estado_ejecucion') {
        if (!['en_laboratorio', 'en_proceso', 'listo'].includes(t.estado)) return false
      }
      if (search) {
        const term = search.toLowerCase()
        if (
          !t.codigo.toLowerCase().includes(term) &&
          !t.paciente.toLowerCase().includes(term) &&
          !t.cliente.toLowerCase().includes(term) &&
          !t.doctor.toLowerCase().includes(term)
        )
          return false
      }
      return true
    })
  }, [trabajos, activeTab, search])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Trabajos</h1>
        {labName ? <p className="mt-1 text-sm text-muted-foreground">{labName}</p> : null}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {tabConfig.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="flex items-center justify-end p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Código/Paciente"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Código</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Doctor</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Paciente</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Fase actual</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Progreso</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Fecha entrega</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      Cargando trabajos…
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-destructive">
                      {error}
                    </td>
                  </tr>
                ) : (
                  filtered.map((trabajo) => {
                    const estado = estadoConfig[trabajo.estado] || estadoConfig.pendiente
                    const avance = avancePorSolicitud[trabajo.id]
                    const faseActual = avance?.ultimaFase || trabajo.faseActual || '—'
                    return (
                      <tr key={trabajo.id} className="transition-colors hover:bg-secondary/30">
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs text-primary hover:underline cursor-pointer">
                            {trabajo.codigo}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${estado.color}`}
                          >
                            {estado.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {trabajo.doctor}
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {trabajo.paciente}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground">
                            {faseActual}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {avance ? (
                            <div
                              className="flex items-center gap-2"
                              title={`${avance.completadas} de ${avance.total} fases completadas`}
                            >
                              <div className="h-1.5 w-24 rounded-full bg-secondary">
                                <div
                                  className="h-1.5 rounded-full bg-primary"
                                  style={{ width: `${avance.progreso}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{avance.progreso}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs">
                            <span className={trabajo.fechaEntrega !== '-' ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                              {trabajo.fechaEntrega}
                            </span>
                            {trabajo.horaEntrega && (
                              <span className="ml-1 text-muted-foreground">
                                {trabajo.horaEntrega}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => router.push(empleado ? `/empleado/mis-solicitudes/${trabajo.id}` : `/laboratorio/solicitudes/${trabajo.id}`)}
                              title="Ver/editar"
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => router.push('/calendario')}
                              title="Ver en calendario"
                            >
                              <Calendar className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loading && !error && filtered.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No se encontraron trabajos con ese criterio.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MoreHorizontal, Search, Edit, Calendar, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

  useEffect(() => {
    loadTrabajos()
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
          caja: '-',
          cliente: s.odontologonombre || s.cliente || s.nombre_cliente || '—',
          clienteCodigo: '-',
          doctor: s.odontologonombre || '',
          paciente: s.paciente || 'Sin paciente',
          faseActual: (s.fase_id && fasesMap[s.fase_id]) || s.faseActual || s.fase_actual || '—',
          fechaEntrega: formatDateToDDMMYYYY(fechaEntrega),
          horaEntrega: extractTime(fechaEntrega) || '-',
        }
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Trabajos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? 'Cargando...' : `Mostrando ${filtered.length} trabajo(s)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <MoreHorizontal className="size-4" />
            Acciones
          </Button>
          <Button className="gap-2 rounded-full">
            <Plus className="size-4" />
            Nuevo trabajo
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {tabConfig.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Search className="size-4" />
              Ver filtros
            </Button>
            <Button variant="ghost" className="text-xs">
              Borrar filtros
            </Button>
          </div>
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Código trabajo
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Caja
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Cliente
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Doctor/a
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Paciente
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Fase actual
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Fecha entrega
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={9} className="px-4 py-4">
                        <div className="h-4 animate-pulse rounded bg-secondary max-w-[80%]"></div>
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="size-4" />
                        <span>{error}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((trabajo) => {
                  const estado = estadoConfig[trabajo.estado] || { label: trabajo.estado, color: 'bg-secondary text-secondary-foreground' }
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
                        {trabajo.caja}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">
                            {trabajo.clienteCodigo}
                          </span>
                          {(() => {
                            const clienteId = clienteIdMap[trabajo.cliente]
                            const href = empleado
                              ? clienteId
                                ? `/empleado/clientes/${clienteId}`
                                : null
                              : clienteId
                                ? `/laboratorio/clientes/${clienteId}`
                                : null
                            if (!href) {
                              return <span className="font-medium text-foreground">{trabajo.cliente}</span>
                            }
                            return (
                              <Link
                                href={href}
                                className="font-medium text-primary hover:underline cursor-pointer"
                              >
                                {trabajo.cliente}
                              </Link>
                            )
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {trabajo.doctor}
                      </td>
                      <td className="px-4 py-4 text-foreground">
                        {trabajo.paciente}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground">
                          {trabajo.faseActual}
                        </span>
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
          {filtered.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No se encontraron trabajos con ese criterio.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



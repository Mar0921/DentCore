'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Eye, MoreHorizontal } from 'lucide-react'
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
import { requests as mockRequests } from '@/data/lab-mock'

interface SolicitudFromDB {
  id: string
  odontologonombre: string | null
  tipo: string | null
  estado: string | null
  prioridad: string | null
  progreso: number | null
  asignado_a: string | null
  created_at: string
  updated_at: string
  notas: string | null
}

interface RequestItem {
  id: string
  odontologistId: string
  odontologistName: string
  type: string
  status: string
  priority: string
  progress: number
  assignedTo?: string
  createdAt: string
  updatedAt: string
  notes?: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'En proceso', color: 'bg-primary/10 text-primary' },
  completed: { label: 'Completada', color: 'bg-accent/15 text-accent' },
  delivered: { label: 'Entregada', color: 'bg-accent/15 text-accent' },
  cancelled: { label: 'Cancelada', color: 'bg-destructive/10 text-destructive' },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'bg-muted text-muted-foreground' },
  medium: { label: 'Media', color: 'bg-muted text-muted-foreground' },
  high: { label: 'Alta', color: 'bg-accent/15 text-accent' },
  urgent: { label: 'Urgente', color: 'bg-destructive/10 text-destructive' },
}

function mapSolicitudToRequest(s: SolicitudFromDB): RequestItem {
  return {
    id: s.id,
    odontologistId: '',
    odontologistName: s.odontologonombre || '-',
    type: s.tipo || 'Sin tipo',
    status: s.estado || 'pending',
    priority: s.prioridad || 'medium',
    progress: s.progreso || 0,
    assignedTo: s.asignado_a || undefined,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    notes: s.notas || undefined,
  }
}

export default function SolicitudesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        const res = await fetch('/api/solicitudes')
        const result = await res.json()
        if (res.ok && result.data && result.data.length > 0) {
          setRequests(result.data.map(mapSolicitudToRequest))
        } else {
          setRequests([])
        }
      } catch {
        // Fall back to mock data only when the API is unavailable
        setRequests(mockRequests)
      } finally {
        setLoading(false)
      }
    }
    fetchSolicitudes()
  }, [])

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (search) {
      const term = search.toLowerCase()
      if (
        !r.type.toLowerCase().includes(term) &&
        !r.odontologistName.toLowerCase().includes(term) &&
        !r.id.toLowerCase().includes(term)
      )
        return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Solicitudes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Solicitudes activas y su estado</p>
        </div>
        <Button className="gap-2" onClick={() => router.push('/laboratorio/solicitudes/nueva')}>
          <Plus className="size-4" />
          Nueva solicitud
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Solicitudes activas</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Listado de solicitudes registradas</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar solicitud..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline" className="gap-2">
                  {statusFilter === 'all' ? 'Todas' : statusConfig[statusFilter]?.label ?? 'Estado'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>Todas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pendientes</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>En proceso</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completadas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('delivered')}>Entregadas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('cancelled')}>Canceladas</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-primary">Cargando solicitudes…</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Obteniendo el listado de solicitudes.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-primary">No hay solicitudes</p>
              <p className="mt-1 text-xs text-muted-foreground">
                No hay solicitudes que coincidan con los filtros actuales.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 font-medium text-muted-foreground">ID</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Odontólogo</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Prioridad</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Progreso</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Asignado a</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((req) => {
                    const estado = statusConfig[req.status] ?? { label: req.status, color: 'bg-muted text-muted-foreground' }
                    const prioridad = priorityConfig[req.priority] ?? { label: req.priority, color: 'bg-muted text-muted-foreground' }
                    return (
                      <tr key={req.id} className="transition-colors hover:bg-secondary/30">
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs text-primary">{req.id}</span>
                        </td>
                        <td className="px-4 py-4 text-foreground">{req.type}</td>
                        <td className="px-4 py-4 text-muted-foreground">{req.odontologistName}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${prioridad.color}`}>
                            {prioridad.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estado.color}`}>
                            {estado.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-secondary">
                              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${req.progress}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{req.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{req.assignedTo ?? '-'}</td>
                        <td className="px-4 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/laboratorio/solicitudes/${req.id}`)}>
                                <Eye className="size-4" />
                                Ver detalle
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

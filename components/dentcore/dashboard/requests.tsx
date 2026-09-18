'use client'

import { useState } from 'react'
import {
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
} from 'lucide-react'
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
import { requests } from '@/data/lab-mock'
import type { RequestStatus, Request } from '@/types/lab'

const statusConfig: Record<
  RequestStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: 'Pendiente',
    color: 'bg-accent/15 text-accent',
    icon: Clock,
  },
  in_progress: {
    label: 'En proceso',
    color: 'bg-primary/10 text-primary',
    icon: AlertTriangle,
  },
  completed: {
    label: 'Completada',
    color: 'bg-accent/15 text-accent',
    icon: CheckCircle2,
  },
  delivered: {
    label: 'Entregada',
    color: 'bg-accent/15 text-accent',
    icon: Truck,
  },
  cancelled: {
    label: 'Cancelada',
    color: 'bg-destructive/10 text-destructive',
    icon: XCircle,
  },
}

const priorityConfig: Record<
  Request['priority'],
  { label: string; color: string }
> = {
  low: { label: 'Baja', color: 'text-muted-foreground' },
  medium: { label: 'Media', color: 'text-accent' },
  high: { label: 'Alta', color: 'text-primary' },
  urgent: { label: 'Urgente', color: 'text-destructive' },
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-secondary">
        <div
          className="h-2 rounded-full bg-accent transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-medium text-muted-foreground">
        {value}%
      </span>
    </div>
  )
}

export function Requests() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false
    if (
      search &&
      !r.type.toLowerCase().includes(search.toLowerCase()) &&
      !r.odontologistName.toLowerCase().includes(search.toLowerCase()) &&
      !r.id.toLowerCase().includes(search.toLowerCase())
    )
      return false
    return true
  })

  const statusCounts = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Solicitudes</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Seguimiento de trabajos y su progreso
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
                  <Filter className="size-4" />
                  Estado
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  Todos
                </DropdownMenuItem>
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setStatusFilter(key)}
                  >
                    {label}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {statusCounts[key] || 0}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline" className="gap-2">
                  <Filter className="size-4" />
                  Prioridad
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPriorityFilter('all')}>
                  Todas
                </DropdownMenuItem>
                {Object.entries(priorityConfig).map(([key, { label }]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setPriorityFilter(key)}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="gap-1.5 rounded-full">
              <Plus className="size-4" />
              Nueva solicitud
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-6 py-3 font-medium text-muted-foreground">
                    ID
                  </th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">
                    Tipo de trabajo
                  </th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">
                    Odontólogo
                  </th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">
                    Estado
                  </th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">
                    Progreso
                  </th>
                  <th className="px-6 py-3 font-medium text-muted-foreground">
                    Asignado
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((request) => {
                  const status = statusConfig[request.status]
                  const StatusIcon = status.icon
                  return (
                    <tr
                      key={request.id}
                      className="transition-colors hover:bg-secondary/30"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {request.id}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">
                          {request.type}
                        </p>
                        {request.notes && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {request.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {request.odontologistName}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.color}`}
                        >
                          <StatusIcon className="size-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            request.priority === 'urgent'
                              ? 'bg-destructive/10 text-destructive'
                              : request.priority === 'high'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-secondary text-secondary-foreground'
                          }`}
                        >
                          {priorityConfig[request.priority].label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-40">
                          <ProgressBar value={request.progress} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {request.assignedTo || '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                              <DropdownMenuItem>Editar</DropdownMenuItem>
                              <DropdownMenuItem>Cambiar estado</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No se encontraron solicitudes con ese criterio.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

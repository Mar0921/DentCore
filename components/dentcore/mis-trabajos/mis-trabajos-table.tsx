'use client'

import { useState } from 'react'
import { Search, MoreHorizontal, Users, ClipboardList, Clock, AlertCircle, ExternalLink } from 'lucide-react'
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
import { tareasMisTrabajos, contadoresMisTrabajos, usuarios } from '@/data/mis-trabajos-mock'
import type { FiltroMisTrabajos } from '@/types/mis-trabajos'

const filtros: { key: FiltroMisTrabajos; label: string }[] = [
  { key: 'actuales', label: 'Actuales' },
  { key: 'externalizadas', label: 'Externalizadas' },
  { key: 'proximas', label: 'Próximas' },
  { key: 'adelante', label: 'Más adelante...' },
  { key: 'por_dia', label: 'Por día' },
  { key: 'todas', label: 'Todas las tareas' },
]

export function MisTrabajosTable() {
  const [filtroActivo, setFiltroActivo] = useState<FiltroMisTrabajos>('actuales')
  const [search, setSearch] = useState('')
  const [usuarioActual, setUsuarioActual] = useState(usuarios[0])

  const filtered = tareasMisTrabajos.filter((t) => {
    if (filtroActivo !== 'todas' && t.estado !== filtroActivo) return false
    if (search) {
      const term = search.toLowerCase()
      if (
        !t.trabajoCodigo.toLowerCase().includes(term) &&
        !t.paciente.toLowerCase().includes(term) &&
        !t.cliente.toLowerCase().includes(term)
      )
        return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">Mis trabajos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tareas asignadas a <span className="font-semibold text-foreground">{usuarioActual.nombre}</span>
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" className="gap-2">
                <Users className="size-4" />
                Cambiar a...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {usuarios.map((usuario) => (
                <DropdownMenuItem
                  key={usuario.id}
                  onClick={() => setUsuarioActual(usuario)}
                >
                  {usuario.nombre}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ClipboardList className="size-5" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{contadoresMisTrabajos.actuales}</p>
              <p className="text-xs text-muted-foreground">Actuales</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Clock className="size-5" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{contadoresMisTrabajos.proximas}</p>
              <p className="text-xs text-muted-foreground">Próximas</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-5" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{contadoresMisTrabajos.vencidas}</p>
              <p className="text-xs text-muted-foreground">Vencidas</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <ExternalLink className="size-5" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{contadoresMisTrabajos.externalizadas}</p>
              <p className="text-xs text-muted-foreground">Externalizadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {filtros.map((filtro) => (
          <Button
            key={filtro.key}
            variant={filtroActivo === filtro.key ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setFiltroActivo(filtro.key)}
          >
            {filtro.label}
          </Button>
        ))}
      </div>

      {/* Filtros y búsqueda */}
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

      {/* Tabla o mensaje vacío */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-primary">No hay resultados</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {usuarioActual.nombre} no tiene tareas en esta categoría.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Código trabajo
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Cliente
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Paciente
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Fase
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-center">
                      N.º de piezas
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Fecha límite
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((tarea) => (
                    <tr key={tarea.id} className="transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs text-primary hover:underline cursor-pointer">
                          {tarea.trabajoCodigo}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">{tarea.clienteCodigo}</span>
                          <span className="font-medium text-foreground">{tarea.cliente}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-foreground">{tarea.paciente}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground">
                          {tarea.fase}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">{tarea.numeroPiezas}</td>
                      <td className="px-4 py-4 text-muted-foreground">{tarea.fechaTope}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {tarea.estado === 'actual' ? 'Actual' : tarea.estado === 'proxima' ? 'Próxima' : tarea.estado === 'adelante' ? 'Más adelante' : 'Externalizada'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver detalle</DropdownMenuItem>
                            <DropdownMenuItem>Cambiar estado</DropdownMenuItem>
                            <DropdownMenuItem>Asignar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

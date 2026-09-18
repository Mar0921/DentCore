'use client'

import { useState } from 'react'
import { Search, Grid3X3, List, MoreHorizontal, ChevronDown, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
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
import { tareasPlanificacion, obtenerDiasSemanaActual } from '@/data/planificacion-mock'
import type { TareaPlanificacion, ModoPlanificacion, VistaPlanificacion } from '@/types/planificacion'

const modosPlanificacion: { key: ModoPlanificacion; label: string; icon: React.ElementType }[] = [
  { key: 'dia', label: 'Tareas por día', icon: List },
  { key: 'semana', label: 'Tareas por semana', icon: Calendar },
  { key: 'calendario', label: 'Calendario', icon: Calendar },
  { key: 'planificar', label: 'Planificar', icon: List },
  { key: 'pruebas', label: 'Pruebas', icon: List },
]

export function PlanificacionTable() {
  const [modoActivo, setModoActivo] = useState<ModoPlanificacion>('planificar')
  const [vista, setVista] = useState<VistaPlanificacion>('lista')
  const [search, setSearch] = useState('')
  const [semanaOffset, setSemanaOffset] = useState(0)

  const diasSemana = obtenerDiasSemanaActual()
  const diaSeleccionado = diasSemana[6 + semanaOffset] || diasSemana[6]

  const filtered = tareasPlanificacion.filter((t) => {
    if (search) {
      const term = search.toLowerCase()
      if (
        !t.trabajoCodigo.toLowerCase().includes(term) &&
        !t.paciente.toLowerCase().includes(term) &&
        !t.cliente.toLowerCase().includes(term) &&
        !t.fase.toLowerCase().includes(term)
      )
        return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Planificación</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Programa y distribuye las tareas de los trabajos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" className="gap-2">
                <MoreHorizontal className="size-4" />
                Acciones
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Exportar planificación</DropdownMenuItem>
              <DropdownMenuItem>Imprimir vista</DropdownMenuItem>
              <DropdownMenuItem>Cambiar vista</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="gap-2 rounded-full">
            Nueva planificación
          </Button>
        </div>
      </div>

      {/* Modos de planificación */}
      <div className="flex flex-wrap items-center gap-2">
        {modosPlanificacion.map((modo) => {
          const Icon = modo.icon
          return (
            <Button
              key={modo.key}
              variant={modoActivo === modo.key ? 'default' : 'outline'}
              className="gap-2"
              onClick={() => setModoActivo(modo.key)}
            >
              <Icon className="size-4" />
              {modo.label}
            </Button>
          )
        })}
      </div>

      {/* Selector de semana */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setSemanaOffset((prev) => prev - 1)}
              >
                ←
              </Button>
              <span className="text-sm font-medium">Semana anterior</span>
            </div>
            <div className="text-sm font-medium">Semana siguiente →</div>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setSemanaOffset((prev) => prev + 1)}
            >
              →
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {diasSemana.map((dia) => {
              const esSeleccionado =
                diaSeleccionado &&
                dia.fechaObj.toDateString() === diaSeleccionado.fechaObj.toDateString()
              return (
                <button
                  key={dia.fecha}
                  type="button"
                  className={cn(
                    'flex flex-col items-center rounded-lg border px-2 py-3 text-center transition-colors',
                    esSeleccionado
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-secondary',
                  )}
                >
                  <span className="text-xs font-medium uppercase">{dia.dia}</span>
                  <span className="mt-1 text-sm font-semibold">{dia.fecha}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Fecha seleccionada y vista */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-primary">
            {diaSeleccionado
              ? diaSeleccionado.fechaObj.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : ''}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={vista === 'lista' ? 'default' : 'outline'}
            size="icon"
            className="size-8"
            onClick={() => setVista('lista')}
          >
            <List className="size-4" />
          </Button>
          <Button
            variant={vista === 'cuadricula' ? 'default' : 'outline'}
            size="icon"
            className="size-8"
            onClick={() => setVista('cuadricula')}
          >
            <Grid3X3 className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" className="gap-2">
                <MoreHorizontal className="size-4" />
                Acciones
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Exportar</DropdownMenuItem>
              <DropdownMenuItem>Imprimir</DropdownMenuItem>
              <DropdownMenuItem>Cambiar filtros</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filtros */}
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

      {/* Tabla */}
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
                    Caja
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
                    A realizar por
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Fecha tope planificada
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Próxima fecha planificada
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
                    <td className="px-4 py-4 text-muted-foreground">{tarea.caja}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          {tarea.clienteCodigo}
                        </span>
                        <span className="font-medium text-foreground">
                          {tarea.cliente}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-foreground">{tarea.paciente}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tarea.colorFase}`}
                      >
                        {tarea.fase}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">{tarea.numeroPiezas}</td>
                    <td className="px-4 py-4 text-muted-foreground">{tarea.responsable}</td>
                    <td className="px-4 py-4 text-muted-foreground">{tarea.fechaTopePlanificada}</td>
                    <td className="px-4 py-4">
                      <div className="text-xs">
                        {tarea.proximaFechaPlanificada !== '-' && (
                          <span className={tarea.proximaFechaPlanificada !== 'FIN DE TRABAJO' ? 'text-destructive font-medium' : 'text-primary font-medium'}>
                            {tarea.proximaFechaPlanificada}
                          </span>
                        )}
                        {tarea.proximaFechaPlanificada === '-' && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No se encontraron tareas con ese criterio.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

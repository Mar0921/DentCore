'use client'

import { useState } from 'react'
import { MoreHorizontal, Search, Edit, Calendar, Plus } from 'lucide-react'
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
import { trabajos } from '@/data/trabajos-mock'
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
}

export function TrabajosTable() {
  const [activeTab, setActiveTab] = useState<TrabajoTab>('en_curso')
  const [search, setSearch] = useState('')

  const filtered = trabajos.filter((t) => {
    if (activeTab === 'en_curso') {
      if (!['en_laboratorio', 'en_proceso'].includes(t.estado)) return false
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Trabajos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mostrando trabajos 1 - {filtered.length} de {filtered.length}
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
                {filtered.map((trabajo) => {
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
                          <span className="font-medium text-foreground">
                            {trabajo.cliente}
                          </span>
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
                          <Button variant="ghost" size="icon" className="size-8">
                            <Edit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8">
                            <Calendar className="size-4" />
                          </Button>
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
              No se encontraron trabajos con ese criterio.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

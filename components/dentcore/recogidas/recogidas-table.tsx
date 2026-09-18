'use client'

import { useState } from 'react'
import { Search, MoreHorizontal, Eye, Edit, Printer, Trash2, Plus, Truck } from 'lucide-react'
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
import { recogidasEnvios } from '@/data/recogidas-mock'
import type { RecogidaTab } from '@/types/recogidas'

const tabs: { key: RecogidaTab; label: string }[] = [
  { key: 'recogidas', label: 'Recogidas' },
  { key: 'envios', label: 'Envíos' },
  { key: 'todas', label: 'Todas' },
]

const estadoConfig: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-muted text-muted-foreground' },
  programado: { label: 'Programado', color: 'bg-primary/10 text-primary' },
  en_recogida: { label: 'En recogida', color: 'bg-accent/15 text-accent' },
  recogido: { label: 'Recogido', color: 'bg-accent/15 text-accent' },
  en_transito: { label: 'En tránsito', color: 'bg-primary/10 text-primary' },
  entregado: { label: 'Entregado', color: 'bg-accent/15 text-accent' },
  cancelado: { label: 'Cancelado', color: 'bg-destructive/10 text-destructive' },
}

export function RecogidasTable() {
  const [activeTab, setActiveTab] = useState<RecogidaTab>('recogidas')
  const [search, setSearch] = useState('')

  const filtered = recogidasEnvios.filter((r) => {
    if (activeTab === 'recogidas' && r.tipo !== 'recogida') return false
    if (activeTab === 'envios' && r.tipo !== 'envio') return false
    if (search) {
      const term = search.toLowerCase()
      if (
        !r.codigo.toLowerCase().includes(term) &&
        !r.servicioTransporte.toLowerCase().includes(term) &&
        !r.cliente.toLowerCase().includes(term)
      )
        return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Recogidas y envíos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona la logística de recogidas y envíos de trabajos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2">
            <Plus className="size-4" />
            Nuevo envío/recogida
          </Button>
          <Button variant="outline" className="gap-2">
            <Truck className="size-4" />
            Recoger nuevo trabajo
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" className="gap-2">
              <MoreHorizontal className="size-4" />
              Acciones
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Printer className="size-4" />
              Imprimir listado
            </DropdownMenuItem>
            <DropdownMenuItem>Exportar a CSV</DropdownMenuItem>
            <DropdownMenuItem>Cambiar estado masivo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
            <Button variant="ghost" className="text-xs">
              este año
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Código/Servicio"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-primary">No hay resultados</p>
              <p className="mt-1 text-xs text-muted-foreground">
                No hay recogidas o envíos que coincidan con los filtros actuales.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Código
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Estado
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Servicio de transporte
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Cliente/Centro
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Proveedor
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Fecha envío
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
                  {filtered.map((item) => {
                    const estado = estadoConfig[item.estado] ?? {
                      label: item.estado,
                      color: 'bg-muted text-muted-foreground',
                    }
                    return (
                      <tr key={item.id} className="transition-colors hover:bg-secondary/30">
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs text-primary hover:underline cursor-pointer">
                            {item.codigo}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estado.color}`}>
                            {estado.label}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {item.servicioTransporte}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {item.clienteCodigo} - {item.cliente}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {item.proveedor}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {item.fechaEnvio}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {item.fechaEntrega}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="size-4" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="size-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Printer className="size-4" />
                                Imprimir comprobante
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="size-4" />
                                Cancelar
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

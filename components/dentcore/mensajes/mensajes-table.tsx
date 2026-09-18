'use client'

import { useState } from 'react'
import { Search, MoreHorizontal, Eye, CheckCircle2, Reply, Download, Trash2 } from 'lucide-react'
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
import { mensajes } from '@/data/mensajes-mock'
import type { FiltroMensajes } from '@/types/mensajes'

const tabs: { key: FiltroMensajes; label: string }[] = [
  { key: 'bandeja_entrada', label: 'Bandeja de entrada' },
  { key: 'bandeja_salida', label: 'Bandeja de salida' },
  { key: 'imagenes', label: 'Imágenes' },
  { key: 'anexos_cad_cam', label: 'Anexos/CAD-CAM' },
  { key: 'materiales_cliente', label: 'Materiales de cliente' },
]

export function MensajesTable() {
  const [tabActiva, setTabActiva] = useState<FiltroMensajes>('bandeja_entrada')
  const [search, setSearch] = useState('')
  const [noLeido, setNoLeido] = useState(true)
  const [pendienteConfirmacion, setPendienteConfirmacion] = useState(false)

  const filtered = mensajes.filter((m) => {
    if (tabActiva !== 'bandeja_entrada' && m.tipo !== tabActiva) return false
    if (noLeido && m.leido) return false
    if (pendienteConfirmacion && !m.pendienteConfirmacion) return false
    if (search) {
      const term = search.toLowerCase()
      if (
        !m.contenido.toLowerCase().includes(term) &&
        !m.cliente.toLowerCase().includes(term) &&
        !m.trabajoCodigo.toLowerCase().includes(term)
      )
        return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Bandeja de entrada</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona mensajes, archivos y elementos relacionados con los trabajos
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={tabActiva === tab.key ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setTabActiva(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" className="gap-2">
              <MoreHorizontal className="size-4" />
              Más opciones
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Marcar todo como leído</DropdownMenuItem>
            <DropdownMenuItem>Descargar todos</DropdownMenuItem>
            <DropdownMenuItem>Exportar listado</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={noLeido}
                onChange={(e) => setNoLeido(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border accent-accent"
              />
              No leído
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={pendienteConfirmacion}
                onChange={(e) => setPendienteConfirmacion(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border accent-accent"
              />
              Pendiente de confirmación
            </label>
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
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-primary">No hay resultados</p>
              <p className="mt-1 text-xs text-muted-foreground">
                No hay mensajes o elementos que coincidan con los filtros actuales.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Contenido
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Fecha envío
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Cliente
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Trabajo
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Estado trabajo
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((mensaje) => (
                    <tr key={mensaje.id} className="transition-colors hover:bg-secondary/30">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {!mensaje.leido && (
                            <span className="size-2 rounded-full bg-primary" />
                          )}
                          <span className={`font-medium ${!mensaje.leido ? 'text-primary' : 'text-foreground'}`}>
                            {mensaje.contenido}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {mensaje.fechaEnvio}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {mensaje.clienteCodigo} - {mensaje.cliente}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs text-primary hover:underline cursor-pointer">
                          {mensaje.trabajoCodigo}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-secondary/50 px-2.5 py-0.5 text-xs font-medium text-foreground">
                          {mensaje.estadoTrabajo}
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
                            <DropdownMenuItem>
                              <Eye className="size-4" />
                              Abrir
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CheckCircle2 className="size-4" />
                              Marcar como leído
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Reply className="size-4" />
                              Responder
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="size-4" />
                              Descargar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="size-4" />
                              Eliminar
                            </DropdownMenuItem>
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

'use client'

import { useState } from 'react'
import { MoreHorizontal, Plus, Search } from 'lucide-react'
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
import { odontologists } from '@/data/lab-mock'

export function Odontologists() {
  const [search, setSearch] = useState('')

  const filtered = odontologists.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.clinic.toLowerCase().includes(search.toLowerCase()) ||
      o.specialty.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Odontólogos</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Tus clientes y sus datos principales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar odontólogo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Button className="gap-1.5 rounded-full">
            <Plus className="size-4" />
            Nuevo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-6 py-3 font-medium text-muted-foreground">
                  Nombre
                </th>
                <th className="px-6 py-3 font-medium text-muted-foreground">
                  Clínica
                </th>
                <th className="px-6 py-3 font-medium text-muted-foreground">
                  Especialidad
                </th>
                <th className="px-6 py-3 font-medium text-muted-foreground">
                  Total solicitudes
                </th>
                <th className="px-6 py-3 font-medium text-muted-foreground">
                  Pendientes
                </th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((odontologist) => (
                <tr
                  key={odontologist.id}
                  className="transition-colors hover:bg-secondary/30"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-foreground">
                        {odontologist.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {odontologist.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {odontologist.clinic}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {odontologist.specialty}
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {odontologist.totalRequests}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        odontologist.pendingRequests > 5
                          ? 'bg-destructive/10 text-destructive'
                          : odontologist.pendingRequests > 0
                            ? 'bg-accent/15 text-accent'
                            : 'bg-accent/15 text-accent'
                      }`}
                    >
                      {odontologist.pendingRequests}
                    </span>
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
                          <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                          <DropdownMenuItem>Ver solicitudes</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No se encontraron odontólogos con ese criterio.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

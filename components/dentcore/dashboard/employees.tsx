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
import { employees } from '@/data/lab-mock'
import type { Employee } from '@/types/lab'

const roleLabels: Record<Employee['role'], string> = {
  admin: 'Administrador',
  technician: 'Técnico',
  assistant: 'Asistente',
  manager: 'Gerente',
}

const roleColors: Record<Employee['role'], string> = {
  admin: 'bg-primary/10 text-primary',
  technician: 'bg-accent/15 text-accent',
  assistant: 'bg-secondary text-secondary-foreground',
  manager: 'bg-primary/10 text-primary',
}

export function Employees() {
  const [search, setSearch] = useState('')

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Empleados</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona el equipo de tu laboratorio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar empleado..."
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
                  Correo
                </th>
                <th className="px-6 py-3 font-medium text-muted-foreground">
                  Departamento
                </th>
                <th className="px-6 py-3 font-medium text-muted-foreground">
                  Rol
                </th>
                <th className="px-6 py-3 font-medium text-muted-foreground">
                  Estado
                </th>
                <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((employee) => (
                <tr key={employee.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-foreground">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">{employee.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{employee.email}</td>
                  <td className="px-6 py-4 text-muted-foreground">{employee.department}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColors[employee.role]}`}
                    >
                      {roleLabels[employee.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        employee.active
                          ? 'bg-accent/15 text-accent'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {employee.active ? 'Activo' : 'Inactivo'}
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
                          <DropdownMenuItem>Editar</DropdownMenuItem>
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
            No se encontraron empleados con ese criterio.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Plus, Edit, Trash2, Tag, UserPlus, MoreHorizontal, Link as LinkIcon } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

type TabClientes = 'clientes' | 'etiquetas' | 'solicitudes'

interface ClienteRow {
  id: string
  codigo: string
  nombre: string
  calle: string | null
  localidad: string | null
  telefono: string | null
  celular: string | null
  email: string | null
  clinica: string | null
  especialidad: string | null
  tieneAcceso: boolean
}

export function ClientesTable() {
  const router = useRouter()
  const [tabActiva, setTabActiva] = useState<TabClientes>('clientes')
  const [search, setSearch] = useState('')
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [clienteAEliminar, setClienteAEliminar] = useState<ClienteRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadClientes()
  }, [])

  async function loadClientes() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cliente')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) {
        const odontoMap = await loadOdontologosPorNombre()
        setClientes(
          data.map((c: any) => ({
            id: c.id,
            codigo: c.codigo || '',
            nombre: c.nombre || '',
            calle: c.calle,
            localidad: c.localidad,
            telefono: c.telefono,
            celular: c.celular,
            email: c.email,
            clinica: c.clinica,
            especialidad: odontoMap[c.nombre || ''] ?? null,
            tieneAcceso: c.tiene_acceso ?? false,
          })),
        )
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadOdontologosPorNombre(): Promise<Record<string, string>> {
    const map: Record<string, string> = {}
    try {
      const { data, error } = await supabase
        .from('odontologos')
        .select('nombre, especialidad')
      if (!error && data) {
        for (const o of data as any[]) {
          if (o.nombre && !(o.nombre in map)) map[o.nombre] = o.especialidad || ''
        }
      }
    } catch (err) {
      console.error('Error cargando odontólogos:', err)
    }
    return map
  }

  const filtered = clientes.filter((c) => {
    if (search) {
      const term = search.toLowerCase()
      if (
        !c.nombre.toLowerCase().includes(term) &&
        !c.codigo.toLowerCase().includes(term) &&
        !c.localidad?.toLowerCase().includes(term)
      )
        return false
    }
    return true
  })

  async function handleConfirmarEliminar() {
    if (!clienteAEliminar || deleting) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('cliente')
        .delete()
        .eq('id', clienteAEliminar.id)
      if (error) throw error
      setClienteAEliminar(null)
      loadClientes()
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administra las clínicas y clientes del laboratorio
          </p>
        </div>
        <Button className="gap-2 rounded-full" onClick={() => router.push('/registro-cliente')}>
          <Plus className="size-4" />
          Nuevo cliente
        </Button>
        <Button
          render={<Link href="/registro-cliente" />}
          variant="outline"
          className="gap-2 rounded-full"
        >
          <LinkIcon className="size-4" />
          Registro de clientes
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={tabActiva === 'clientes' ? 'default' : 'outline'}
          className="gap-2"
          onClick={() => setTabActiva('clientes')}
        >
          Clientes
        </Button>
        <Button
          variant={tabActiva === 'etiquetas' ? 'default' : 'outline'}
          className="gap-2"
          onClick={() => setTabActiva('etiquetas')}
        >
          <Tag className="size-4" />
          Etiquetas para clientes
        </Button>
        <Button
          variant={tabActiva === 'solicitudes' ? 'default' : 'outline'}
          className="gap-2"
          onClick={() => setTabActiva('solicitudes')}
        >
          <UserPlus className="size-4" />
          Solicitudes de alta
        </Button>
      </div>

      {tabActiva === 'clientes' && (
        <>
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
                  placeholder="Código/Nombre"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contador */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando clientes {filtered.length > 0 ? '1' : '0'} - {Math.min(20, filtered.length)} de {filtered.length}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline" className="gap-2">
                  <MoreHorizontal className="size-4" />
                  Acciones
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Exportar clientes</DropdownMenuItem>
                <DropdownMenuItem>Imprimir listado</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tabla */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead>
                     <tr className="border-b border-border bg-secondary/30">
                       <th className="px-4 py-3 font-medium text-muted-foreground">
                         Nombre
                       </th>
                       <th className="px-4 py-3 font-medium text-muted-foreground">
                         Email
                       </th>
                       <th className="px-4 py-3 font-medium text-muted-foreground">
                         Calle
                       </th>
                       <th className="px-4 py-3 font-medium text-muted-foreground">
                         Localidad
                       </th>
                       <th className="px-4 py-3 font-medium text-muted-foreground">
                         Teléfono
                       </th>
                       <th className="px-4 py-3 font-medium text-muted-foreground">
                         Celular
                       </th>
                       <th className="px-4 py-3 font-medium text-muted-foreground">
                         Clínica
                       </th>
                       <th className="px-4 py-3 font-medium text-muted-foreground">
                         Especialidad
                       </th>
                       <th className="px-4 py-3 font-medium text-muted-foreground text-center">
                         ¿Tiene acceso?
                       </th>
                       <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                         Acciones
                       </th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                     {loading ? (
                       <tr>
                         <td colSpan={10} className="px-4 py-8 text-center text-sm text-muted-foreground">
                           Cargando clientes...
                         </td>
                       </tr>
                     ) : filtered.length === 0 ? (
                       <tr>
                         <td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">
                           No se encontraron clientes con ese criterio.
                         </td>
                       </tr>
                     ) : (
                       filtered.map((cliente) => (
                         <tr key={cliente.id} className="transition-colors hover:bg-secondary/30">
                         <td className="px-4 py-4">
                           <Link
                             href={`/laboratorio/clientes/${cliente.id}`}
                             className="font-medium text-primary hover:underline cursor-pointer"
                           >
                             {cliente.codigo ? `${cliente.codigo} - ` : ''}{cliente.nombre}
                           </Link>
                         </td>
                         <td className="px-4 py-4 text-muted-foreground">
                           {cliente.email || '—'}
                         </td>
                           <td className="px-4 py-4 text-muted-foreground">
                             {cliente.calle || '—'}
                           </td>
                           <td className="px-4 py-4 text-muted-foreground">
                             {cliente.localidad || '—'}
                           </td>
                           <td className="px-4 py-4 text-muted-foreground">
                             {cliente.telefono || '—'}
                           </td>
                           <td className="px-4 py-4 text-muted-foreground">
                             {cliente.celular || '—'}
                           </td>
                           <td className="px-4 py-4 text-muted-foreground">
                             {cliente.clinica || '—'}
                           </td>
                           <td className="px-4 py-4 text-muted-foreground">
                             {cliente.especialidad || '—'}
                           </td>
                           <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cliente.tieneAcceso ? 'bg-accent/15 text-accent' : 'bg-destructive/10 text-destructive'
                                }`}
                            >
                              {cliente.tieneAcceso ? '✓' : '×'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                             <div className="flex items-center justify-end gap-1">
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 className="size-8"
                                 title="Editar cliente"
                                 onClick={() => router.push(`/laboratorio/clientes/${cliente.id}`)}
                               >
                                 <Edit className="size-4" />
                               </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-destructive hover:text-destructive"
                                  title="Eliminar cliente"
                                  onClick={() => setClienteAEliminar(cliente)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                             </div>
                           </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {tabActiva === 'etiquetas' && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            <Tag className="mx-auto size-8 mb-2" />
            <p>Gestión de etiquetas para clientes</p>
            <p className="text-xs mt-1">Próximamente disponible</p>
          </CardContent>
        </Card>
      )}

      {tabActiva === 'solicitudes' && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            <UserPlus className="mx-auto size-8 mb-2" />
            <p>Solicitudes de alta de nuevos clientes</p>
            <p className="text-xs mt-1">Próximamente disponible</p>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!clienteAEliminar}
        onOpenChange={(open) => !open && setClienteAEliminar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cliente?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará al cliente{' '}
              <span className="font-medium">{clienteAEliminar?.nombre || ''}</span>{' '}
              y sus datos asociados dejarán de estar disponibles.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClienteAEliminar(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmarEliminar}
              disabled={deleting}
              className="gap-2"
            >
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

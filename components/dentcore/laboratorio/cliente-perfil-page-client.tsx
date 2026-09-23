'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ChevronLeft, Save, RefreshCw, Trash2, User, ExternalLink } from 'lucide-react'

interface Cliente {
  id: string
  codigo: string | null
  nombre: string | null
  calle: string | null
  localidad: string | null
  telefono: string | null
  celular: string | null
  email: string | null
  clinica: string | null
  laboratorio_id: string | null
  tiene_acceso: boolean | null
  created_at: string
  updated_at: string
}

interface Solicitud {
  id: string
  codigo_trazabilidad: string | null
  tipo: string | null
  estado: string | null
  prioridad: string | null
  progreso: number | null
  odontologonombre: string | null
  paciente: string | null
  created_at: string
  updated_at: string
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
}

const PRIORIDAD_LABEL: Record<string, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
}

const SELECT_CLASS =
  "h-10 w-full rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"

function formatDate(value?: string) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2 py-2 border-b border-border last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground break-words">{value || '—'}</span>
    </div>
  )
}

export function ClientePerfilPageClient({ empleado = false }: { empleado?: boolean }) {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [form, setForm] = useState<Partial<Cliente>>({})
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [especialidad, setEspecialidad] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    loadCliente()
  }, [id])

  async function loadCliente() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cliente')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (!error && data) {
        setCliente(data as Cliente)
        setForm({
          codigo: data.codigo,
          nombre: data.nombre,
          calle: data.calle,
          localidad: data.localidad,
          telefono: data.telefono,
          celular: data.celular,
          email: data.email,
          clinica: data.clinica,
          tiene_acceso: data.tiene_acceso ?? false,
        })
         await loadSolicitudes(data as Cliente)
       } else {
         setCliente(null)
         setEspecialidad(null)
       }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadSolicitudes(c: Cliente) {
    try {
      const nombreBuscado = c.nombre
      const clinicaBuscado = c.clinica
      let solicitudesResult: any[] = []

      if (nombreBuscado) {
        const { data: odonto } = await supabase
          .from('odontologos')
          .select('id, especialidad')
          .eq('nombre', nombreBuscado)
          .maybeSingle()

        if (odonto?.id) {
          setEspecialidad(odonto.especialidad || null)
          const { data } = await supabase
            .from('solicitudes')
            .select('*')
            .eq('odontologo_id', odonto.id)
            .order('created_at', { ascending: false })
          if (data) solicitudesResult = data
        } else {
          setEspecialidad(null)
        }

        if (solicitudesResult.length === 0) {
          const { data } = await supabase
            .from('solicitudes')
            .select('*')
            .eq('odontologonombre', nombreBuscado)
            .order('created_at', { ascending: false })
          if (data) solicitudesResult = data
        }

        if (solicitudesResult.length === 0 && clinicaBuscado) {
          const { data } = await supabase
            .from('solicitudes')
            .select('*')
            .eq('odontologonombre', clinicaBuscado)
            .order('created_at', { ascending: false })
          if (data) solicitudesResult = data
        }
      }

      setSolicitudes(solicitudesResult as Solicitud[])
    } catch (err) {
      console.error('Error cargando solicitudes:', err)
    }
  }

  function setField<K extends keyof Cliente>(field: K, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!cliente || saving) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('cliente')
        .update({
          codigo: form.codigo ?? null,
          nombre: form.nombre ?? null,
          calle: form.calle ?? null,
          localidad: form.localidad ?? null,
          telefono: form.telefono ?? null,
          celular: form.celular ?? null,
          email: form.email ?? null,
          clinica: form.clinica ?? null,
          tiene_acceso: form.tiene_acceso ?? false,
        })
        .eq('id', cliente.id)
      if (error) throw error

      setCliente((prev) =>
        prev ? { ...prev, ...form, tiene_acceso: form.tiene_acceso ?? false } : prev,
      )
      setIsEditing(false)
    } catch (err: any) {
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleDelete() {
    if (!cliente) return
    setDeleteOpen(true)
  }

  async function handleConfirmDelete() {
    if (!cliente || deleting) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('cliente').delete().eq('id', cliente.id)
      if (error) throw error
      setDeleteOpen(false)
      alert('Cliente eliminado correctamente')
      router.push('/laboratorio/clientes')
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <ClienteHeader
          backOnClick={() => router.back()}
          title="Detalle de cliente"
          subtitle={id ?? ''}
        />
        <Card>
          <CardHeader>
            <CardTitle>Cargando…</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Obteniendo los datos del cliente.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="space-y-4">
        <ClienteHeader
          backOnClick={() => router.back()}
          title="Detalle de cliente"
          subtitle={id ?? ''}
        />
        <Card>
          <CardHeader>
            <CardTitle>No se encontró el cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No existe un cliente con el ID <span className="font-mono">{id}</span>.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
       <ClienteHeader
        backOnClick={() => router.back()}
        title={cliente.nombre || 'Cliente'}
        subtitle={`#${cliente.id} · Código ${cliente.codigo ?? '—'}`}
        badge={cliente.tiene_acceso ? 'Activo' : 'Sin acceso'}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing((prev) => !prev)}
        onDelete={handleDelete}
        empleado={empleado}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isEditing ? 'Edición de cliente' : 'Datos del cliente'}
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {isEditing
              ? 'Modifique los campos y guarde los cambios.'
              : 'Información registrada del cliente. Presione "Editar" para realizar cambios.'}
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {isEditing ? (
            <>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Código</label>
                <Input
                  value={form.codigo ?? ''}
                  onChange={(e) => setField('codigo', e.target.value)}
                  placeholder="Código"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Nombre</label>
                <Input
                  value={form.nombre ?? ''}
                  onChange={(e) => setField('nombre', e.target.value)}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Email</label>
                <Input
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="cliente@ejemplo.com"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Teléfono</label>
                <Input
                  value={form.telefono ?? ''}
                  onChange={(e) => setField('telefono', e.target.value)}
                  placeholder="+57 300 123 4567"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Celular</label>
                <Input
                  value={form.celular ?? ''}
                  onChange={(e) => setField('celular', e.target.value)}
                  placeholder="+57 300 123 4567"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Clínica</label>
                <Input
                  value={form.clinica ?? ''}
                  onChange={(e) => setField('clinica', e.target.value)}
                  placeholder="Nombre de la clínica"
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-primary">Calle / Dirección</label>
                <Input
                  value={form.calle ?? ''}
                  onChange={(e) => setField('calle', e.target.value)}
                  placeholder="Calle y número"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Localidad</label>
                <Input
                  value={form.localidad ?? ''}
                  onChange={(e) => setField('localidad', e.target.value)}
                  placeholder="Ciudad"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">¿Tiene acceso?</label>
                <select
                  value={form.tiene_acceso ? 'true' : 'false'}
                  onChange={(e) => setField('tiene_acceso', e.target.value === 'true')}
                  className={SELECT_CLASS}
                >
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <InfoRow label="Nombre" value={cliente.nombre} />
              <InfoRow label="Código" value={cliente.codigo} />
              <InfoRow label="Email" value={cliente.email} />
              <InfoRow label="Teléfono" value={cliente.telefono} />
              <InfoRow label="Celular" value={cliente.celular} />
              <InfoRow label="Clínica" value={cliente.clinica} />
              <InfoRow label="Especialidad" value={especialidad} />
              <InfoRow label="Calle / Dirección" value={cliente.calle} />
              <InfoRow label="Localidad" value={cliente.localidad} />
              <InfoRow
                label="¿Tiene acceso?"
                value={
                  cliente.tiene_acceso ? (
                    <span className="inline-flex rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                      Sí
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                      No
                    </span>
                  )
                }
              />
               {!empleado && <InfoRow label="Laboratorio ID" value={cliente.laboratorio_id} />}
               <InfoRow label="Creado" value={formatDate(cliente.created_at)} />
               <InfoRow label="Actualizado" value={formatDate(cliente.updated_at)} />
            </>
          )}
        </CardContent>
        {!empleado && (
        <CardFooter className="flex justify-end gap-2 border-t border-border">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
              <User className="size-4" />
              Editar
            </Button>
          )}
        </CardFooter>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Solicitudes vinculadas</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Solicitudes registradas para este cliente
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {solicitudes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-primary">Sin solicitudes</p>
              <p className="mt-1 text-xs text-muted-foreground">
                No hay solicitudes vinculadas a este cliente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Código</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Prioridad</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Progreso</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Creada</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {solicitudes.map((s) => (
                    <tr
                      key={s.id}
                      className="transition-colors hover:bg-secondary/30"
                    >
                      <td className="px-4 py-4 font-mono text-xs text-primary">
                        {s.codigo_trazabilidad || `#${s.id}`}
                      </td>
                      <td className="px-4 py-4 text-foreground">{s.tipo || '—'}</td>
                      <td className="px-4 py-4">{ESTADO_LABEL[s.estado || ''] || s.estado || '—'}</td>
                      <td className="px-4 py-4">{PRIORIDAD_LABEL[s.prioridad || ''] || s.prioridad || '—'}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-secondary">
                            <div
                              className="h-1.5 rounded-full bg-primary"
                              style={{ width: `${s.progreso ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {s.progreso ?? 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {formatDate(s.created_at)}
                      </td>
                      <td className="px-4 py-4 text-right">
       <Button
                           variant="ghost"
                           size="sm"
                           className="gap-1"
                           render={<Link href={empleado ? `/empleado/mis-solicitudes/${s.id}` : `/laboratorio/solicitudes/${s.id}`} />}
                         >
                          <ExternalLink className="size-3" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cliente?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará al cliente{' '}
              <span className="font-medium">{cliente?.nombre || ''}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="gap-2"
            >
              {deleting ? 'Eliminando…' : (
                <>
                  <Trash2 className="size-4" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ClienteHeader({
  backOnClick,
  title,
  subtitle,
  badge,
  isEditing,
  onToggleEdit,
  onDelete,
  empleado,
}: {
  backOnClick: () => void
  title: string
  subtitle: string
  badge?: string
  isEditing?: boolean
  onToggleEdit?: () => void
  onDelete?: () => void
  empleado?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="size-8" onClick={backOnClick}>
          <ChevronLeft className="size-4" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">{title}</h1>
          <p className="text-sm text-muted-foreground font-mono">{subtitle}</p>
        </div>
        {badge && (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              badge === 'Activo'
                ? 'bg-accent/15 text-accent'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onDelete && !empleado && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
            Eliminar
          </Button>
        )}
        {onToggleEdit && !empleado && (
          <Button variant="outline" size="sm" onClick={onToggleEdit}>
            {isEditing ? 'Cancelar edición' : 'Editar'}
          </Button>
        )}
      </div>
    </div>
  )
}

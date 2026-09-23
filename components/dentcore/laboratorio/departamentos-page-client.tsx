'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Building2, Users, Search, AlertCircle, Check } from 'lucide-react'

interface Empleado {
  id: string
  nombre: string
  email: string | null
  rol: string
  departamento_id?: string | null
}

interface Departamento {
  id: string
  nombre: string
  descripcion: string | null
  empleados_count: number
  created_at: string
}

const STORAGE_KEY = 'departamento_asignaciones'

export function DepartamentosPageClient({ empleado = false }: { empleado?: boolean }) {
  const [departamentos, setDepartamento] = useState<Departamento[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Departamento | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingEmpleados, setLoadingEmpleados] = useState(true)
  const [asignacionesLocales, setAsignacionesLocales] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' })
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  useEffect(() => {
    loadDepartamentos()
    loadEmpleados()
  }, [])

  /* ------------------------------------------------------------------ */
  /* Carga de datos                                                     */
  /* ------------------------------------------------------------------ */
  async function loadDepartamentos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('departamentos')
      .select('id, nombre, descripcion, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando departamentos:', error)
      setMensajeError(error.message)
    } else {
      const mapped = (data || []).map((d: any) => ({
        ...d,
        empleados_count: 0,
      }))
      setDepartamento(mapped)
      cargarConteoEmpleados(mapped)
    }
    setLoading(false)
  }

  async function loadEmpleados() {
    setLoadingEmpleados(true)

    // Try selecting with departamento_id; fall back if column doesn't exist yet
    const { data, error } = await supabase
      .from('empleados')
      .select('id, nombre, email, rol, departamento_id')
      .order('nombre', { ascending: true })

    if (error) {
      const msg = String(error.message || '')
      if (msg.includes('departamento_id') || !error.message) {
        // Column doesn't exist yet — load basic fields only
        const fallback = await supabase
          .from('empleados')
          .select('id, nombre, email, rol')
          .order('nombre', { ascending: true })
        if (fallback.data) setEmpleados(fallback.data || [])
      } else {
        console.error('Error cargando empleados:', error)
      }
    } else {
      setEmpleados(data || [])
    }
    setLoadingEmpleados(false)
  }

  async function cargarConteoEmpleados(deps: Departamento[]) {
    const { data, error } = await supabase
      .from('empleados')
      .select('departamento_id, id', { count: 'exact' })

    if (error) {
      const msg = String(error.message || '')
      if (msg.includes('departamento_id') || !error.message) {
        // Column doesn't exist — counts remain 0
        return
      }
      console.error('Error cargando conteo:', error)
    } else if (data) {
      const countMap: Record<string, number> = {}
      data.forEach((row: any) => {
        const key = row.departamento_id
        if (key) countMap[key] = (countMap[key] || 0) + 1
      })
      setDepartamento(
        deps.map((d) => ({ ...d, empleados_count: countMap[d.id] || 0 }))
      )
    }
  }

  /* ------------------------------------------------------------------ */
  /* CRUD de departamentos                                               */
  /* ------------------------------------------------------------------ */
  function handleNew() {
    setEditing(null)
    setFormData({ nombre: '', descripcion: '' })
    setMensajeError(null)
    setOpen(true)
  }

  function handleEdit(dep: Departamento) {
    setEditing(dep)
    setFormData({ nombre: dep.nombre, descripcion: dep.descripcion || '' })
    setMensajeError(null)
    setOpen(true)
  }

  async function handleSubmit() {
    try {
      if (!formData.nombre.trim()) {
        setMensajeError('El nombre del departamento es requerido')
        return
      }

      if (editing) {
        const { error } = await supabase
          .from('departamentos')
          .update({ nombre: formData.nombre, descripcion: formData.descripcion })
          .eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('departamentos')
          .insert({ nombre: formData.nombre, descripcion: formData.descripcion })
        if (error) throw error
      }
      setOpen(false)
      loadDepartamentos()
    } catch (err: any) {
      setMensajeError(err.message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar este departamento?')) return
    const { error } = await supabase.from('departamentos').delete().eq('id', id)
    if (error) {
      alert('Error al eliminar: ' + error.message)
      return
    }
    loadDepartamentos()
  }

  /* ------------------------------------------------------------------ */
  /* Asignación de empleados                                             */
  /* ------------------------------------------------------------------ */
  function loadAsignacionesLocales(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    } catch {
      return {}
    }
  }

  function saveAsignacionesLocales(map: Record<string, string>) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  }

  const empPertenecientes = (depId: string): Empleado[] =>
    empleados.filter((e) => {
      const row = e as any
      return row.departamento_id === depId || asignacionesLocales[depId] === e.id
    })

  const toggleEmpleado = async (depId: string, empId: string) => {
    const emp = empleados.find((e) => e.id === empId)
    const isAssigned = (emp as any)?.departamento_id === depId
    const newDepId = isAssigned ? null : depId

    const prevLocales = { ...asignacionesLocales }
    setAsignacionesLocales((prev) => {
      const next = { ...prev }
      if (next[depId] === empId) {
        delete next[depId]
      } else {
        next[depId] = empId
      }
      saveAsignacionesLocales(next)
      return next
    })

    try {
      const { error } = await supabase
        .from('empleados')
        .update({ departamento_id: newDepId })
        .eq('id', empId)
      if (error) throw error

      await loadEmpleados()
      await loadDepartamentos()
    } catch (err: any) {
      console.warn('No se pudo persistir la asignación:', err?.message || err)
      setAsignacionesLocales(prevLocales)
      saveAsignacionesLocales(prevLocales)
    }
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  const filtered = useMemo(() => {
    if (!search) return departamentos
    const term = search.toLowerCase()
    return departamentos.filter((d) => d.nombre.toLowerCase().includes(term))
  }, [departamentos, search])

  if (loading && departamentos.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold text-primary">Departamentos</h1>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-5 w-3/4 animate-pulse rounded bg-secondary" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Departamentos</h1>
        <p className="text-sm text-muted-foreground">
          Organización por áreas del laboratorio
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar departamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        {!empleado && (
        <Button onClick={handleNew} className="gap-2">
          <Plus className="size-4" />
          Nuevo Departamento
        </Button>
        )}
      </div>

      {mensajeError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {mensajeError}
        </div>
      )}

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="mb-4 size-16 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
            No hay departamentos registrados. Haz clic en "Nuevo Departamento" para agregar uno.
          </p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((dep) => (
            <Card key={dep.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{dep.nombre}</CardTitle>
                    <CardDescription>
                      {dep.descripcion || <span className="italic text-muted-foreground/60">Sin descripción</span>}
                    </CardDescription>
                  </div>
               <div className="flex items-center gap-2">
                    {!empleado && (
                    <>
                     <Button variant="ghost" size="sm" onClick={() => handleEdit(dep)}>
                       <Edit className="size-4" />
                     </Button>
                     <Button variant="ghost" size="sm" onClick={() => handleDelete(dep.id)}>
                       <Trash2 className="size-4 text-destructive" />
                     </Button>
                    </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4" />
                  <span>{dep.empleados_count} empleado(s)</span>
                </div>

                 <div className="space-y-2">
                   <p className="text-xs font-medium text-muted-foreground">
                     {empleado ? 'Empleados:' : 'Asignar empleados:'}
                   </p>
                   {empleados.length === 0 ? (
                     <p className="text-xs text-muted-foreground">No hay empleados registrados.</p>
                   ) : (
                     empleados.map((emp) => {
                       const row = emp as any
                       const assigned = row.departamento_id === dep.id
                       return (
                         <div key={emp.id} className={`flex items-center justify-between rounded-md border border-border px-3 py-2 ${assigned ? 'bg-secondary/30' : ''}`}>
                           <div className="flex-1">
                             <p className="font-medium text-foreground">{emp.nombre}</p>
                             <p className="text-xs text-muted-foreground">
                               {emp.email && <span>{emp.email}</span>}
                               {emp.email && emp.rol && <span className="mx-1">•</span>}
                               {emp.rol && <span>{emp.rol}</span>}
                             </p>
                           </div>
                           {!empleado && (
                           <button
                             type="button"
                             onClick={() => toggleEmpleado(dep.id, emp.id)}
                             className={`ml-3 flex size-5 items-center justify-center rounded border transition-colors ${
                               assigned
                                 ? 'bg-primary/10 border-primary text-primary'
                                 : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                             }`}
                           >
                             {assigned && <Check className="size-3" />}
                           </button>
                           )}
                         </div>
                       )
                     })
                   )}
                 </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Departamento' : 'Nuevo Departamento'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Actualiza los datos del departamento' : 'Crea un nuevo departamento para el laboratorio'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Producción, Administración..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional del departamento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editing ? 'Actualizar' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface EmpleadosConDepartamento extends Empleado {
  departamento_id: string | null
}

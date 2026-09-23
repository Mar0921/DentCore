'use client'

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Plus, Edit, Trash2, UserRound, Eye, EyeOff, Building2 } from "lucide-react"

export function EmpleadosPageClient() {
  const [empleados, setEmpleados] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [laboratorioId, setLaboratorioId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    contraseña: "",
    rol: "tecnico",
    departamento: "",
    departamento_id: "",
    telefono: "",
    activo: true,
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    loadLaboratorio()
    loadEmpleados()
    loadDepartamentos()
  }, [])

  async function loadLaboratorio() {
    const { data } = await supabase.from("laboratorio").select("id").limit(1)
    if (data && data.length > 0) setLaboratorioId(data[0].id)
  }

  async function loadDepartamentos() {
    const { data, error } = await supabase
      .from('departamentos')
      .select('id, nombre')
      .order('nombre', { ascending: true })
    if (!error && data) setDepartamentos(data)
  }

  async function loadEmpleados() {
    const { data } = await supabase.from("empleados").select("*").order("created_at", { ascending: false })
    if (data) setEmpleados(data)
  }

  function handleEdit(em: any) {
    setEditing(em)
    setFormData({
      nombre: em.nombre,
      email: em.email || "",
      contraseña: "",
      rol: em.rol,
      departamento: em.departamento || "",
      departamento_id: em.departamento_id || "",
      telefono: em.telefono || "",
      activo: em.activo,
    })
    setOpen(true)
  }

  function handleNew() {
    setEditing(null)
    setFormData({
      nombre: "",
      email: "",
      contraseña: "",
      rol: "tecnico",
      departamento: "",
      departamento_id: "",
      telefono: "",
      activo: true,
    })
    setOpen(true)
  }

  async function handleSubmit() {
    try {
      if (!laboratorioId) {
        alert("No se encontró el laboratorio. Crea uno primero.")
        return
      }

      if (editing) {
        const updates: any = { ...formData }
        delete updates.departamento
        delete updates.departamento_id
        if (formData.departamento_id) updates.departamento_id = formData.departamento_id
        if (!updates.contraseña) delete updates.contraseña
        const { error } = await supabase.from("empleados").update(updates).eq("id", editing.id)
        if (error) throw error
      } else {
        if (!formData.contraseña || formData.contraseña.length < 6) {
          alert("La contraseña debe tener al menos 6 caracteres.")
          return
        }
        const toInsert: any = { ...formData, contraseña: formData.contraseña, laboratorio_id: laboratorioId }
        delete toInsert.departamento
        if (!toInsert.departamento_id) delete toInsert.departamento_id
        const { error } = await supabase.from("empleados").insert(toInsert)
        if (error) throw error
      }
      setOpen(false)
      loadEmpleados()
    } catch (err: any) {
      console.error("Error completo:", err)
      const msg = err?.message || err?.details || err?.hint || JSON.stringify(err) || "Error desconocido"
      alert("Error al guardar: " + msg)
    }
  }

  async function handleDelete(id: string) {
    if (confirm("¿Estás seguro de eliminar este empleado?")) {
      const { error } = await supabase.from("empleados").delete().eq("id", id)
      if (error) {
        alert("Error al eliminar: " + error.message)
        return
      }
      loadEmpleados()
    }
  }

  if (!laboratorioId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Building2 className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-heading text-lg font-semibold text-primary">
          No hay laboratorio registrado
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Primero debes crear tu laboratorio. Ve a la página de suscripción para comenzar.
        </p>
        <Button render={<Link href="/suscripcion" />} className="mt-4 gap-2">
          <Plus className="size-4" />
          Crear laboratorio
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Empleados</h1>
          <p className="text-sm text-muted-foreground">Gestiona el personal del laboratorio</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="size-4" />
          Nuevo Empleados
        </Button>
      </div>

      <div className="grid gap-4">
        {empleados.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay empleados registrados. Haz clic en "Nuevo Empleados" para agregar uno.
          </div>
        ) : (
          empleados.map((em) => (
            <Card key={em.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <UserRound className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">{em.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {em.rol} - {departamentos.find(d => d.id === em.departamento_id)?.nombre || em.departamento || "Sin departamento"}
                    </p>
                    <p className="text-xs text-muted-foreground">{em.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(em)}>
                    <Edit className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(em.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Empleados" : "Nuevo Empleados"}</DialogTitle>
            <DialogDescription>
              {editing ? "Actualiza los datos del empleado" : "Agrega un nuevo empleado al laboratorio"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del empleado"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="em@laboratorio.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Contraseña</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.contraseña}
                  onChange={(e) => setFormData({ ...formData, contraseña: e.target.value })}
                  placeholder={editing ? "Deja vacío para mantener" : "Contraseña (mínimo 6 caracteres)"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Rol</label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                >
                  <option value="tecnico">Técnico</option>
                  <option value="asistente">Asistente</option>
                  <option value="gerente">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Departamento</label>
                <select
                  value={formData.departamento_id || ""}
                  onChange={(e) => setFormData({ ...formData, departamento_id: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                >
                  <option value="">Sin departamento</option>
                  {departamentos.map((dep) => (
                    <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+34 123 456 789"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              />
              <label htmlFor="activo" className="text-sm font-medium">
                Activo
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editing ? "Actualzar" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
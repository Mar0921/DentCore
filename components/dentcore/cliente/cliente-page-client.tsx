'use client'

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Search, Copy, Link, User, Phone, Mail } from "lucide-react"

export function ClientesPageClient() {
  const [clients, setClients] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    clinica: "",
    invitationlink: "",
  })
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    const { data } = await supabase.from("cliente").select("*").order("created_at", { ascending: false })
    if (data) setClients(data)
  }

  function handleEdit(c: any) {
    setEditing(c)
    setFormData({
      nombre: c.nombre || "",
      email: c.email || c.email || "",
      telefono: c.telefono || c.telefono || "",
      clinica: c.clinica || c.clinica || "",
      invitationlink: c.invitationlink || c.invitationlink || "",
    })
    setOpen(true)
  }

  function handleNew() {
    setEditing(null)
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      clinica: "",
      invitationlink: "",
    })
    setOpen(true)
  }

  async function handleSubmit() {
    try {
      if (editing) {
        await supabase.from("cliente").update(formData).eq("id", editing.id)
      } else {
        await supabase.from("cliente").insert({ ...formData })
      }
      setOpen(false)
      loadClients()
    } catch (err) {
      console.error("Error:", err)
    }
  }

  async function handleDelete(id: string) {
    if (confirm("¿Estás seguro de eliminar este cliente?")) {
      await supabase.from("cliente").delete().eq("id", id)
      loadClients()
    }
  }

  async function copyInvitationLink() {
    const link = formData.invitationLink || `${window.location.origin}/registro-cliente`
    await navigator.clipboard.writeText(link)
    alert("Enlace copiado al portapapeles")
  }

  const filtered = clients.filter(c =>
    !search || 
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.clinica?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Clients</h1>
          <p className="text-sm text-muted-foreground">Gestiona tus clientes</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="size-4" />
          Agregar Clientes
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Busque clientes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay clientes. Haz clic en " agregar Clientes" para comenzar.
          </div>
        ) : (
          filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">{c.nombre}</p>
                    <p className="text-sm text-muted-foreground">{c.clinica || "Sin clínica"}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                    {c.invitationLink && (
                      <div className="mt-2 flex items-center gap-2">
                        <Link className="size-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground truncate max-w-xs">{c.invitationLink}</p>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-6"
                          onClick={() => {
                            navigator.clipboard.writeText(c.invitationLink)
                            alert("Enlace copiado")
                          }}
                        >
                          <Copy className="size-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                    <Edit className="size-4" />
                  </Button>
                  {c.invitationLink && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        navigator.clipboard.writeText(c.invitationLink)
                        alert("Enlace copiado al portapapeles")
                      }}
                      title="Compartir enlace"
                    >
                      <Copy className="size-4 text-accent" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
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
            <DialogTitle>{editing ? "Editar Clientes" : "Nuevo Clientes"}</DialogTitle>
            <DialogDescription>
              {editing ? "Actualiza los datos del cliente" : "Agrega un nuevo cliente"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={formData.nombre || ""}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del cliente"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="cliente@ejemplo.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                value={formData.telefono || ""}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+57 300 123 4567"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Clínica</label>
              <Input
                value={formData.clinica || ""}
                onChange={(e) => setFormData({ ...formData, clinica: e.target.value })}
                placeholder="Nombre de la clínica"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Enlace de invitación</label>
              <div className="flex gap-2">
                <Input
                  value={formData.invitationLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/registro-cliente`}
                  onChange={(e) => setFormData({ ...formData, invitationLink: e.target.value })}
                  placeholder="Enlace de invitación"
                  readOnly
                />
                <Button type="button" variant="outline" size="icon" onClick={copyInvitationLink}>
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Haz clic en el icono para copiar el enlace de invitación
              </p>
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
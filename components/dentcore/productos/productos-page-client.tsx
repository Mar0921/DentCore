'use client'

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2, Package, Search } from "lucide-react"

export function ProductosPageClient() {
  const [productos, setDatos] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    titulo: "",
    nombre: "",
    description: "",
    material: "",
    categoria: "",
    precio: 0,
    activo: true,
  })
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadproductos()
  }, [])

  async function loadproductos() {
    const { data } = await supabase.from("productos").select("*").order("created_at", { ascending: false })
    if (data) setDatos(data)
  }

  function handleEdit(prod: any) {
    setEditing(prod)
    setFormData({
      titulo: prod.titulo || prod.nombre || "",
      nombre: prod.nombre || "",
      description: prod.description || prod.description || "",
      material: prod.material || "",
      categoria: prod.categoria || "",
      precio: prod.precio || 0,
      activo: prod.activo !== undefined ? prod.activo : true,
    })
    setOpen(true)
  }

  function handleNew() {
    setEditing(null)
    setFormData({
      titulo: "",
      nombre: "",
      description: "",
      material: "",
      categoria: "",
      precio: 0,
      activo: true,
    })
    setOpen(true)
  }

  async function handleSubmit() {
    try {
      const dataToSave = {
        ...formData,
        precio: Number(formData.precio) || 0,
      }

      console.log("Guardando producto:", dataToSave)

      if (editing) {
        const { error } = await supabase.from("productos").update(dataToSave).eq("id", editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("productos").insert(dataToSave)
        if (error) throw error
      }
      setOpen(false)
      loadproductos()
    } catch (err) {
      console.error("Error:", err)
      alert("Error al guardar: " + (err as any).message)
    }
  }

  async function handleDelete(id: string) {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      const { error } = await supabase.from("productos").delete().eq("id", id)
      if (error) {
        alert("Error al eliminar: " + error.message)
        return
      }
      loadproductos()
    }
  }

  const filtered = productos.filter(p =>
    !search || 
    p.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  )

  function formatPrice(price: number) {
    if (!price) return "Bs. 0"
    return "Bs. " + price.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Products</h1>
          <p className="text-sm text-muted-foreground">Catálogo de productos del laboratorio</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="size-4" />
          Agregar Producto
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Busque productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No hay productos. Haz clic en " agregar Producto" para comenzar.
          </div>
        ) : (
          filtered.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <Package className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">{p.titulo || p.nombre}</p>
                    <p className="text-sm text-muted-foreground">{p.description || "Sin material"}</p>
                    <p className="text-xs text-muted-foreground">{p.categoria || "Sin categoría"}</p>
                    <p className="text-xs font-medium text-accent">{formatPrice(p.precio)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                    <Edit className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
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
            <DialogTitle>{editing ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            <DialogDescription>
              {editing ? "Actualiza los datos del producto" : "Agrega un nuevo producto al catálogo"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={formData.titulo || ""}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título del producto"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={formData.nombre || ""}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del producto"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Input
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del producto"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Material</label>
                <Input
                  value={formData.material || ""}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  placeholder="Ej: Zirconia, Porcelana..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Categoría</label>
                <select
                  value={formData.categoria || ""}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                >
                  <option value="">Seleccionar categoría</option>
                  <option value="LIBRE DE METAL">LIBRE DE METAL</option>
                  <option value="ENCERADOS">ENCERADOS</option>
                  <option value="METAL">METAL</option>
                  <option value="RESINAS IMPRESAS">RESINAS IMPRESAS</option>
                  <option value="ACRÍLICOS">ACRÍLICOS</option>
                  <option value="IMPLANTOLOGÍA">IMPLANTOLOGÍA</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Precio (COP)</label>
              <Input
                type="text"
                value={formData.precio || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "")
                  setFormData({ ...formData, precio: val })
                }}
                placeholder="Ej: 150000"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Ingresa el precio en pesos colombianos (ej: 150000 = $150.000)
              </p>
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
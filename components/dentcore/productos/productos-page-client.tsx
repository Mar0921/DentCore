'use client'

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Edit, Trash2, Package, Search, Settings, Check, ChevronDown } from "lucide-react"

export function ProductosPageClient() {
  const [productos, setDatos] = useState<any[]>([])
  const [fases, setFases] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [deleting, setDeleting] = useState<any | null>(null)
  const [fasesDialogOpen, setFasesDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [productFases, setProductFases] = useState<Record<string, string[]>>({})
  const [formData, setFormData] = useState({
    titulo: "",
    description: "",
    material: "",
    categoria: "",
    precio: 0,
    activo: true,
  })
  const [formFases, setFormFases] = useState<string[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    loadproductos()
    loadFases()
  }, [])

  async function loadproductos() {
    const { data } = await supabase.from("productos").select("*").order("created_at", { ascending: false })
    if (data) setDatos(data)
  }

  async function loadFases() {
    const { data, error } = await supabase.from("fases").select("*").order("orden", { ascending: true })
    if (error) {
      console.error("Error loading fases:", error)
      return
    }
    if (data) {
      setFases(data)
    }
  }

  async function loadProductFases() {
    const { data } = await supabase.from("producto_fases").select("producto_id, fase_id").order("orden")
    if (data) {
      const mapped: Record<string, string[]> = {}
      data.forEach(item => {
        if (!mapped[item.producto_id]) mapped[item.producto_id] = []
        mapped[item.producto_id].push(item.fase_id)
      })
      setProductFases(mapped)
    }
  }

  useEffect(() => {
    loadProductFases()
  }, [productos])

  function handleEdit(prod: any) {
    setEditing(prod)
    setFormData({
      titulo: prod.titulo || "",
      description: prod.description || "",
      material: prod.material || "",
      categoria: prod.categoria || "",
      precio: prod.precio || 0,
      activo: prod.activo !== undefined ? prod.activo : true,
    })
    // Cargar fases existentes del producto
    setFormFases(productFases[prod.id] || [])
    setOpen(true)
  }

  function handleNew() {
    setEditing(null)
    setFormData({
      titulo: "",
      description: "",
      material: "",
      categoria: "",
      precio: 0,
      activo: true,
    })
    setFormFases([])
    setOpen(true)
  }

  async function handleSubmit() {
    try {
      const dataToSave = {
        ...formData,
        precio: Number(formData.precio) || 0,
      }

      console.log("Guardando producto:", dataToSave)

      let productId = editing?.id

      if (editing) {
        const { error } = await supabase.from("productos").update(dataToSave).eq("id", editing.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from("productos").insert(dataToSave).select("id").single()
        if (error) throw error
        productId = data.id
      }

      // Guardar fases del producto
      if (productId) {
        // Eliminar relaciones existentes
        await supabase.from("producto_fases").delete().eq("producto_id", productId)
        
        // Insertar nuevas relaciones
        if (formFases.length > 0) {
          const inserts = formFases.map((faseId, index) => ({
            producto_id: productId,
            fase_id: faseId,
            orden: index + 1,
          }))
          const { error } = await supabase.from("producto_fases").insert(inserts)
          if (error) throw error
        }
      }

      setOpen(false)
      setFormFases([])
      loadproductos()
    } catch (err) {
      console.error("Error:", err)
      alert("Error al guardar: " + (err as any).message)
    }
  }

  function handleFasesClick(prod: any) {
    setSelectedProduct(prod)
    setFasesDialogOpen(true)
  }

  async function handleFasesSubmit() {
    if (!selectedProduct) return
    
    try {
      // Eliminar relaciones existentes
      await supabase.from("producto_fases").delete().eq("producto_id", selectedProduct.id)
      
      // Insertar nuevas relaciones
      const productFaseIds = productFases[selectedProduct.id] || []
      if (productFaseIds.length > 0) {
        const inserts = productFaseIds.map((faseId, index) => ({
          producto_id: selectedProduct.id,
          fase_id: faseId,
          orden: index + 1,
        }))
        const { error } = await supabase.from("producto_fases").insert(inserts)
        if (error) throw error
      }
      
      setFasesDialogOpen(false)
      setSelectedProduct(null)
      loadProductFases()
    } catch (err) {
      console.error("Error:", err)
      alert("Error al guardar fases: " + (err as any).message)
    }
  }

  function toggleFase(faseId: string) {
    const current = productFases[selectedProduct?.id] || []
    if (current.includes(faseId)) {
      setProductFases({
        ...productFases,
        [selectedProduct!.id]: current.filter(id => id !== faseId)
      })
    } else {
      setProductFases({
        ...productFases,
        [selectedProduct!.id]: [...current, faseId]
      })
    }
  }

  function isFaseSelected(faseId: string) {
    return productFases[selectedProduct?.id]?.includes(faseId) ?? false
  }

  async function handleDelete(id: string) {
    const prod = productos.find(p => p.id === id)
    setDeleting(prod)
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      const { error } = await supabase.from("productos").delete().eq("id", deleting.id)
      if (error) throw error
      setDeleting(null)
      loadproductos()
    } catch (err) {
      console.error("Error:", err)
      alert("Error al eliminar: " + (err as any).message)
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
              <CardContent className="flex items-start justify-between p-4 gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <Package className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-semibold text-primary truncate">{p.titulo || p.nombre}</p>
                    <p className="text-sm text-muted-foreground truncate">{p.description || "Sin descripción"}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-secondary">{p.categoria || "Sin categoría"}</span>
                      <span className="px-2 py-0.5 rounded bg-secondary">{p.material || "Sin material"}</span>
                      <span className={`px-2 py-0.5 rounded ${p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-accent">{formatPrice(p.precio)}</p>
                    {p.created_at && (
                      <p className="text-xs text-muted-foreground">Creado: {new Date(p.created_at).toLocaleDateString('es-ES')}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                    <Edit className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleFasesClick(p)} title="Asignar fases">
                    <Settings className="size-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            <DialogDescription>
              {editing ? "Actualiza los datos del producto" : "Agrega un nuevo producto al catálogo"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-[1fr_1fr] gap-6 overflow-y-auto flex-1 min-h-0">
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

              <div>
                <label className="text-sm font-medium">Precio (COP)</label>
                <Input
                  type="text"
                  value={formData.precio || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "")
                    setFormData({ ...formData, precio: val ? Number(val) : 0 })
                  }}
                  placeholder="Ej: 150000"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Ingresa el precio en pesos colombianos (ej: 150000 = $150.000)
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Fases del proceso</label>
                <p className="text-xs text-muted-foreground">
                  Selecciona las fases que componen este producto (orden de elaboración)
                </p>
              </div>
              {fases.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay fases disponibles. Configura las fases primero.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {formFases.map((faseId, index) => {
                      const fase = fases.find(f => f.id === faseId)
                      return fase ? (
                        <div key={faseId} className="flex items-center gap-1 bg-primary/10 rounded-md px-2 py-1.5">
                          <span className="text-xs font-medium text-primary">#{index + 1}</span>
                          <span className="text-sm text-foreground">{fase.nombre}</span>
                          <button
                            type="button"
                            onClick={() => setFormFases(formFases.filter(id => id !== faseId))}
                            className="hover:text-destructive"
                          >
                            <ChevronDown className="size-3 rotate-45" />
                          </button>
                        </div>
                      ) : null
                    })}
                  </div>
                  <div className="grid gap-2 max-h-80 overflow-y-auto p-2 border rounded-lg">
                    {fases.map((fase) => {
                      const isSelected = formFases.includes(fase.id)
                      return (
                        <label
                          key={fase.id}
                          className={`flex items-center gap-2 rounded-md p-2 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/10 border border-primary/30'
                              : 'hover:bg-secondary'
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setFormFases(formFases.filter(id => id !== fase.id))
                            } else {
                              setFormFases([...formFases, fase.id])
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="size-4 text-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium block">{fase.nombre}</span>
                            <p className="text-[10px] text-muted-foreground">
                              {fase.orden && `Ord: ${fase.orden}`}
                              {fase.descripcion && ` • ${fase.descripcion.substring(0, 50)}`}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="text-xs font-bold text-primary">#{formFases.indexOf(fase.id) + 1}</span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editing ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar <strong>{deleting?.titulo || deleting?.nombre || "este producto"}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fasesDialogOpen} onOpenChange={setFasesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Fases del proceso: {selectedProduct?.titulo || selectedProduct?.nombre}</DialogTitle>
            <DialogDescription>
              Selecciona las fases que componen el proceso de elaboración de este producto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {fases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay fases disponibles. Crea fases primero en la configuración.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {fases.map((fase) => (
                  <label
                    key={fase.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
                      isFaseSelected(fase.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-secondary/50'
                    }`}
                    onClick={() => toggleFase(fase.id)}
                  >
                    <input
                      type="checkbox"
                      checked={isFaseSelected(fase.id)}
                      onChange={() => toggleFase(fase.id)}
                      className="size-4 text-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{fase.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        Orden: {fase.orden || '—'}
                        {fase.descripcion && ` • ${fase.descripcion}`}
                      </p>
                    </div>
                    {isFaseSelected(fase.id) && (
                      <Check className="size-5 text-primary" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFasesDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleFasesSubmit}>
              Guardar fases
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
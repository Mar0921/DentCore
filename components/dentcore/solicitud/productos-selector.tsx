'use client'

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

export function ProductosSelector() {
  const [productos, setDatos] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadproductos()
  }, [])

  async function loadproductos() {
    const { data } = await supabase.from("productos").select("*").eq("activo", true).order("created_at", { ascending: false })
    if (data) setDatos(data)
    setLoading(false)
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="size-5" />
          Producto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Busque productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay productos registrados
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium text-primary">{p.titulo || p.nombre}</p>
                  <p className="text-sm text-muted-foreground">{p.description || "Sin material"}</p>
                  <p className="text-xs text-muted-foreground">{p.categoria || "Sin categoría"}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-accent">{formatPrice(p.precio)}</p>
                  <p className="text-xs text-muted-foreground">{p.precio} miles</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
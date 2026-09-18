'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Package, Search } from 'lucide-react'

function formatoPrecio(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`
}

export function InvitadoProductosPageClient() {
  const [productos, setProductos] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProductos()
  }, [])

  async function loadProductos() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('categoria', { ascending: true })
      if (!error && data) setProductos(data)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = productos.filter((p) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      (p.titulo || p.nombre || '').toLowerCase().includes(term) ||
      (p.categoria || '').toLowerCase().includes(term) ||
      (p.material || '').toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Productos</h1>
        <p className="text-sm text-muted-foreground">Catálogo de productos disponibles</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="mx-auto size-12 mb-2 opacity-50" />
          <p>No hay productos disponibles</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="text-base">{p.titulo || p.nombre || 'Sin nombre'}</CardTitle>
                <CardDescription className="text-xs">{p.categoria || 'Sin categoría'}</CardDescription>
              </CardHeader>
              <CardContent>
                {p.description && (
                  <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
                )}
                <p className="text-sm">
                  <span className="text-xs text-muted-foreground">Material: </span>
                  {p.material || '—'}
                </p>
                <p className="font-mono font-semibold text-primary">{formatoPrecio(p.precio)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

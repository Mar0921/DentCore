'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, RefreshCw, Search, Package } from 'lucide-react'

interface Producto {
  id: string
  titulo: string | null
  nombre: string | null
  description: string | null
  categoria: string | null
  material: string | null
  precio: number
  activo?: boolean
}

function formatPrice(value: number | string | null | undefined) {
  const num = Number(value) || 0
  return 'Bs. ' + num.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function TarifasPageClient() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<string>('')
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    loadProductos()
  }, [])

  async function loadProductos() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('titulo', { ascending: true })
      if (error) throw error
      if (data) setProductos(data as Producto[])
    } catch (err: any) {
      console.error('Error:', err)
      alert('Error al cargar los productos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(prod: Producto) {
    setEditingId(prod.id)
    setDraft(String(prod.precio ?? 0))
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft('')
  }

  async function savePrecio(prod: Producto) {
    if (editingId !== prod.id) return
    const value = Number(draft.replace(/[^0-9.]/g, '')) || 0
    setSavingId(prod.id)
    try {
      const { error } = await supabase
        .from('productos')
        .update({ precio: value })
        .eq('id', prod.id)
      if (error) throw error
      setProductos((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, precio: value } : p)),
      )
      cancelEdit()
    } catch (err: any) {
      alert('Error al guardar el precio: ' + err.message)
    } finally {
      setSavingId(null)
    }
  }

  const filtered = productos.filter((p) => {
    const term = search.toLowerCase()
    if (!term) return true
    const nombre = (p.titulo || p.nombre || '').toLowerCase()
    return (
      nombre.includes(term) ||
      (p.categoria || '').toLowerCase().includes(term) ||
      (p.material || '').toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Tarifas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Precio de venta por producto. Edita directamente en la tabla y guarda el cambio.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Productos y tarifas</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {filtered.length} producto(s)
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              Cargando tarifas…
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No hay productos registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Producto
                    </th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">
                      Categoría
                    </th>
                    <th className="px-4 py-3 font-medium text-right text-muted-foreground">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((p) => {
                    const isEditing = editingId === p.id
                    const isSaving = savingId === p.id
                    return (
                      <tr
                        key={p.id}
                        className="transition-colors hover:bg-secondary/30"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="size-4 shrink-0 text-muted-foreground" />
                            <div>
                              <span className="font-medium text-primary">
                                {p.titulo || p.nombre || '—'}
                              </span>
                              {p.description && (
                                <p className="text-xs text-muted-foreground">
                                  {p.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {p.categoria || '—'}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              min={0}
                              step="any"
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') savePrecio(p)
                                if (e.key === 'Escape') cancelEdit()
                              }}
                              className="w-32 justify-end font-mono text-right"
                              autoFocus
                              disabled={isSaving}
                            />
                          ) : (
                            <span className="font-mono text-primary">
                              {formatPrice(p.precio)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1"
                                onClick={() => savePrecio(p)}
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <RefreshCw className="size-3 animate-spin" />
                                ) : (
                                  <Save className="size-3" />
                                )}
                                Guardar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEdit}
                                disabled={isSaving}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEdit(p)}
                            >
                              Editar
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

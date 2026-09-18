'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { User, Mail, Phone, Building2, Edit, Save, X, Package, Receipt } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ProductoLinea {
  producto: string
  unidades: number
  dientes: string
  precioUnitario: number
  total: number
}

const productoRegex = /(.+?)\s*x(\d+)\s*\(([^)]*)\)\s*a\s*\$([\d.,]+)/gi

function parseMoney(value: string): number {
  const cleaned = value.trim()
  if (cleaned.includes(',') && cleaned.includes('.')) {
    if (cleaned.lastIndexOf('.') < cleaned.lastIndexOf(',')) {
      return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0
    }
  }
  return parseFloat(cleaned.replace(/,/g, '.')) || 0
}

function parseProductos(productosStr: string): ProductoLinea[] {
  if (!productosStr) return []
  const results: ProductoLinea[] = []
  let match: RegExpExecArray | null
  while ((match = productoRegex.exec(productosStr)) !== null) {
    const producto = match[1].trim()
    const unidades = parseInt(match[2], 10)
    const dientes = match[3].trim()
    const precioUnitario = parseMoney(match[4])
    results.push({
      producto,
      unidades,
      dientes,
      precioUnitario,
      total: unidades * precioUnitario,
    })
  }
  return results
}

function formatoPrecio(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`
}

export function InvitadoEstadoCuentaPageClient() {
  const [invitado, setInvitado] = useState<any>(null)
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    clinica: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvitado()
    loadSolicitudes()
  }, [])

  async function loadInvitado() {
    try {
      const email = localStorage.getItem('labUserEmail')
      if (!email) return

      const { data } = await supabase.from('cliente').select('*').eq('email', email).single()
      if (data) {
        setInvitado(data)
        setFormData({
          nombre: data.nombre || '',
          email: data.email || '',
          telefono: data.telefono || '',
          clinica: data.clinica || '',
        })
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  async function loadSolicitudes() {
    try {
      const email = localStorage.getItem('labUserEmail')
      if (!email) return

      const { data: clienteData } = await supabase
        .from('cliente')
        .select('id, nombre')
        .eq('email', email)
        .maybeSingle()

      const nombreBuscado = clienteData?.nombre
      let result: any[] = []

      if (nombreBuscado) {
        const { data: odonto } = await supabase
          .from('odontologos')
          .select('id')
          .eq('nombre', nombreBuscado)
          .maybeSingle()

        if (odonto?.id) {
          const { data } = await supabase
            .from('solicitudes')
            .select('*')
            .eq('odontologo_id', odonto.id)
            .order('created_at', { ascending: false })
          if (data) result = data
        }
      }

      if (result.length === 0 && nombreBuscado) {
        const { data } = await supabase
          .from('solicitudes')
          .select('*')
          .eq('odontologonombre', nombreBuscado)
          .order('created_at', { ascending: false })
        if (data) result = data
      }

      setSolicitudes(result)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      const email = localStorage.getItem('labUserEmail')
      if (!email) return

      await supabase.from('cliente').update(formData).eq('email', email)
      setInvitado({ ...invitado, ...formData })
      setEditing(false)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const productosAPagar = useMemo(() => {
    const all: ProductoLinea[] = []
    solicitudes.forEach((s) => {
      parseProductos(s.productos || '').forEach((p) => {
        all.push(p)
      })
    })
    return all
  }, [solicitudes])

  const totalAPagar = useMemo(
    () => productosAPagar.reduce((sum, p) => sum + p.total, 0),
    [productosAPagar],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Estado de cuenta</h1>
        <p className="text-sm text-muted-foreground">Productos que debe pagar</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Datos Personales
            </CardTitle>
            <CardDescription>{invitado?.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div>
                  <label className="text-sm font-medium">Nombre</label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Clínica</label>
                  <Input
                    value={formData.clinica}
                    onChange={(e) => setFormData({ ...formData, clinica: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="size-4" />
                    Guardar
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    <X className="size-4" />
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <User className="size-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">{invitado?.nombre || 'Sin nombre'}</p>
                    <p className="text-xs text-muted-foreground">{invitado?.clinica || 'Sin clínica'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="text-sm">{invitado?.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-muted-foreground" />
                    <span className="text-sm">{invitado?.telefono || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-muted-foreground" />
                    <span className="text-sm">{invitado?.clinica || '—'}</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full gap-2" onClick={() => setEditing(true)}>
                  <Edit className="size-4" />
                  Editar perfil
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5" />
              Productos pendientes de pago
            </CardTitle>
            <CardDescription>
              {productosAPagar.length === 0
                ? 'No tiene productos pendientes de pago.'
                : `${productosAPagar.length} producto(s) en ${solicitudes.length} solicitud(es)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productosAPagar.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay productos que mostrar.</p>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/50 text-left">
                        <th className="px-3 py-2 font-medium text-muted-foreground">PRODUCTO</th>
                        <th className="px-3 py-2 font-medium text-muted-foreground text-center">UNIDADES</th>
                        <th className="px-3 py-2 font-medium text-muted-foreground text-center">DIENTES</th>
                        <th className="px-3 py-2 font-medium text-muted-foreground text-right">PRECIO UNIT.</th>
                        <th className="px-3 py-2 font-medium text-muted-foreground text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {productosAPagar.map((p, i) => (
                        <tr key={i} className="transition-colors hover:bg-secondary/30">
                          <td className="px-3 py-2">{p.producto}</td>
                          <td className="px-3 py-2 text-center">{p.unidades}</td>
                          <td className="px-3 py-2 text-center text-muted-foreground">{p.dientes || '—'}</td>
                          <td className="px-3 py-2 text-right font-mono">{formatoPrecio(p.precioUnitario)}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold">{formatoPrecio(p.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-border bg-secondary/30">
                        <td colSpan={4} className="px-3 py-2 text-right text-sm font-bold">TOTAL A PAGAR</td>
                        <td className="px-3 py-2 text-right font-mono text-xl font-bold text-primary">{formatoPrecio(totalAPagar)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm">
                  <Receipt className="size-4 text-primary" />
                  <span className="font-medium text-primary">
                    Total general: {formatoPrecio(totalAPagar)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </>
      )}
    </div>
  )
}

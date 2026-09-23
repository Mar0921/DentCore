'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppShell } from '@/components/dentcore/app-shell'
import { supabase } from '@/lib/supabase'

interface ClienteRow {
  id: string
  codigo: string
  nombre: string
  email: string | null
  telefono: string | null
  celular: string | null
  clinica: string | null
}

export default function EmpleadoClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClientes()
  }, [])

  async function loadClientes() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cliente')
        .select('id, codigo, nombre, email, telefono, celular, clinica')
        .order('created_at', { ascending: false })
      if (!error && data) {
        setClientes(
          data.map((c: any) => ({
            id: c.id,
            codigo: c.codigo || '',
            nombre: c.nombre || '',
            email: c.email,
            telefono: c.telefono,
            celular: c.celular,
            clinica: c.clinica,
          })),
        )
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = clientes.filter((c) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      c.nombre.toLowerCase().includes(term) ||
      c.codigo.toLowerCase().includes(term) ||
      c.clinica?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    )
  })

  return (
    <AppShell sidebar="empleado">
      <div className="space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading ? 'Cargando...' : `Mostrando ${filtered.length} cliente(s)`}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Código</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Teléfono</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Clínica</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Cargando clientes...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        No se encontraron clientes con ese criterio.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((cliente) => (
                      <tr key={cliente.id} className="transition-colors hover:bg-secondary/30">
                        <td className="px-4 py-4 font-medium text-foreground">
                          {cliente.nombre}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground font-mono text-xs">
                          {cliente.codigo || '—'}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {cliente.email || '—'}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {cliente.telefono || cliente.celular || '—'}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {cliente.clinica || '—'}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => router.push(`/empleado/clientes/${cliente.id}`)}
                            title={`Ver perfil de ${cliente.nombre}`}
                          >
                            <Eye className="size-4" />
                            Ver perfil
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

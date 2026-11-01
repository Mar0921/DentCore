'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AppShell } from '@/components/dentcore/app-shell'
import { ChevronLeft, Plus, Save } from 'lucide-react'

interface Incidencia {
  id: string
  codigo: string | null
  solicitud_id: string
  tipo: string | null
  fecha: string | null
  hora: string | null
  fase: string | null
  descripcion: string | null
  responsable: string | null
  estado: string | null
  fecha_creacion: string | null
  updated_at: string | null
}

interface Medida {
  id: string
  incidencia_id: string
  estado: string | null
  fecha_resolucion: string | null
  responsable: string | null
  medidas_tomadas: string
  created_at: string
}

export default function DetalleIncidenciaEmpleadoPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [incidencia, setIncidencia] = useState<Incidencia | null>(null)
  const [loading, setLoading] = useState(true)
  const [medidas, setMedidas] = useState<Medida[]>([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    estado: 'nueva',
    fecha_resolucion: '',
    responsable: '',
    medidas_tomadas: '',
  })

  useEffect(() => {
    if (!id) return
    cargarIncidencia()
    cargarMedidas()
  }, [id])

  async function cargarIncidencia() {
    setLoading(true)
    try {
      const res = await fetch(`/api/incidencias?id=${id}`)
      if (res.ok) {
        const result = await res.json()
        if (result?.data) {
          setIncidencia(result.data)
          setLoading(false)
          return
        }
      }
      const { data } = await supabase.from('incidencias').select('*').eq('id', id).maybeSingle()
      setIncidencia(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function cargarMedidas() {
    try {
      const res = await fetch(`/api/incidencia-medidas?incidencia_id=${id}`)
      if (res.ok) {
        const result = await res.json()
        if (Array.isArray(result?.data)) {
          setMedidas(result.data)
          return
        }
      }
      const { data } = await supabase
        .from('incidencia_medidas')
        .select('*')
        .eq('incidencia_id', id)
        .order('created_at', { ascending: true })
      setMedidas(data || [])
    } catch (e) {
      console.error(e)
    }
  }

  async function handleGuardarMedida(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.medidas_tomadas.trim() || !id) {
      alert('Por favor describe las medidas tomadas')
      return
    }
    setGuardando(true)
    try {
      const res = await fetch('/api/incidencia-medidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidencia_id: id,
          estado: formData.estado,
          fecha_resolucion: formData.fecha_resolucion || null,
          responsable: formData.responsable || null,
          medidas_tomadas: formData.medidas_tomadas,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error al guardar medida')
      setMedidas((prev) => [...prev, result.data])
      setFormData({ estado: 'nueva', fecha_resolucion: '', responsable: '', medidas_tomadas: '' })
      setMostrarForm(false)
      // Forzar actualización con última medida
      try {
        const mres = await fetch(`/api/incidencia-medidas?incidencia_id=${id}`)
        if (mres.ok) {
          const mj = await mres.json()
          if (Array.isArray(mj.data) && mj.data.length > 0) {
            const ultima = mj.data[mj.data.length - 1]
            const est = (ultima.estado || 'nueva').toLowerCase().trim()
            let nuevo = 'abierta'
            if (est === 'resuelta' || est === 'aplicada' || est === 'cerrada') nuevo = 'cerrada'
            else if (est === 'en_proceso') nuevo = 'en_proceso'
            await fetch('/api/incidencias', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, estado: nuevo }),
            })
          }
        }
      } catch {}
      await cargarIncidencia()
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setGuardando(false)
    }
  }

  function formatFecha(fecha?: string | null) {
    if (!fecha) return '—'
    try {
      return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES')
    } catch {
      return fecha
    }
  }

  if (loading) {
    return (
      <AppShell sidebar="empleado">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold text-primary">Detalle de Incidencia</h1>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  if (!incidencia) {
    return (
      <AppShell sidebar="empleado">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold text-primary">Detalle de Incidencia</h1>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">No se encontró la incidencia</p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell sidebar="empleado">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">Detalle de Incidencia</h1>
            <p className="text-sm text-muted-foreground font-mono">{incidencia.codigo || incidencia.id}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Medidas y seguimiento</CardTitle>
            <Button size="sm" onClick={() => setMostrarForm(!mostrarForm)} className="gap-2">
              <Plus className="h-4 w-4" />
              {mostrarForm ? 'Cancelar' : 'Agregar medida'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {mostrarForm && (
              <form onSubmit={handleGuardarMedida} className="p-4 border rounded-lg space-y-3 bg-muted/50">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="estadoMedida" className="text-sm font-medium">Estado</label>
                    <select
                      id="estadoMedida"
                      value={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="nueva">Nueva</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="aplicada">Aplicada</option>
                      <option value="resuelta">Resuelta</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="responsableMedida" className="text-sm font-medium">Responsable</label>
                    <Input
                      id="responsableMedida"
                      value={formData.responsable}
                      onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                      placeholder="Nombre"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="fechaRes" className="text-sm font-medium">Fecha de resolución</label>
                    <Input
                      id="fechaRes"
                      type="date"
                      value={formData.fecha_resolucion}
                      onChange={(e) => setFormData({ ...formData, fecha_resolucion: e.target.value })}
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="medidas" className="text-sm font-medium">Medidas tomadas *</label>
                  <textarea
                    id="medidas"
                    value={formData.medidas_tomadas}
                    onChange={(e) => setFormData({ ...formData, medidas_tomadas: e.target.value })}
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Describe las medidas correctivas tomadas..."
                    required
                  />
                </div>
                <Button type="submit" disabled={guardando} size="sm" className="gap-2">
                  <Save className="h-3 w-3" />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </Button>
              </form>
            )}

            {medidas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay medidas registradas</p>
            ) : (
              <div className="space-y-3">
                {medidas.map((med) => (
                  <div key={med.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {med.created_at ? new Date(med.created_at).toLocaleString('es-ES') : '—'}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          med.estado === 'resuelta' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {med.estado || 'nueva'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Medidas tomadas</p>
                      <p className="text-sm whitespace-pre-wrap">{med.medidas_tomadas}</p>
                    </div>
                    {med.responsable && (
                      <div>
                        <p className="text-xs text-muted-foreground">Responsable</p>
                        <p className="text-sm">{med.responsable}</p>
                      </div>
                    )}
                    {med.fecha_resolucion && (
                      <div>
                        <p className="text-xs text-muted-foreground">Fecha de resolución</p>
                        <p className="text-sm">{new Date(med.fecha_resolucion + 'T00:00:00').toLocaleDateString('es-ES')}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

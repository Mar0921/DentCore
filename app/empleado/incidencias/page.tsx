'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppShell } from '@/components/dentcore/app-shell'
import { Plus, Eye } from 'lucide-react'

interface Incidencia {
  id: string
  codigo: string | null
  solicitud_id: string
  solicitud_codigo_trazabilidad?: string | null
  tipo: string | null
  fecha: string | null
  hora: string | null
  fase: string | null
  descripcion: string | null
  responsable: string | null
  estado: string | null
  fecha_creacion: string | null
}

interface TipoIncidencia {
  id: string
  nombre: string
  laboratorio_id: string | null
}

export default function EmpleadoIncidenciasPage() {
  const router = useRouter()
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [tiposIncidencia, setTiposIncidencia] = useState<TipoIncidencia[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingTipos, setLoadingTipos] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [laboratorioId, setLaboratorioId] = useState<string | null>(null)

  useEffect(() => {
    cargarIncidencias()
    cargarTiposIncidencia()
  }, [])

  async function cargarIncidencias() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/incidencias')
      if (res.ok) {
        const result = await res.json()
        if (Array.isArray(result?.data)) {
          setIncidencias(result.data)
          setLoading(false)
          return
        }
      }
      // Fallback a Supabase
      const { data, error: supaError } = await supabase
        .from('incidencias')
        .select('*')
        .order('fecha_creacion', { ascending: false })
      if (supaError) throw supaError
      setIncidencias(data || [])
    } catch (e: any) {
      setError(e?.message || 'Error al cargar incidencias')
    } finally {
      setLoading(false)
    }
  }

  async function cargarTiposIncidencia() {
    setLoadingTipos(true)
    try {
      const savedLabId = localStorage.getItem('labId')
      if (savedLabId) {
        setLaboratorioId(savedLabId)
        await fetchTipos(savedLabId)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const { data: emp } = await supabase
          .from('empleados')
          .select('laboratorio_id')
          .eq('email', user.email)
          .maybeSingle()
        if (emp?.laboratorio_id) {
          setLaboratorioId(emp.laboratorio_id)
          localStorage.setItem('labId', emp.laboratorio_id)
          await fetchTipos(emp.laboratorio_id)
          return
        }
        const { data: labs } = await supabase.from('laboratorio').select('id').limit(1)
        if (labs && labs.length > 0) {
          setLaboratorioId(labs[0].id)
          localStorage.setItem('labId', labs[0].id)
          await fetchTipos(labs[0].id)
        }
      }
    } catch {
      // silencioso
    } finally {
      setLoadingTipos(false)
    }
  }

  async function fetchTipos(labId: string) {
    try {
      const res = await fetch(`/api/tipos-incidencia?laboratorio_id=${labId}`)
      if (res.ok) {
        const result = await res.json()
        setTiposIncidencia(Array.isArray(result?.data) ? result.data : [])
      }
    } catch {
      // silencioso
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

  return (
    <AppShell sidebar="empleado">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">Incidencias</h1>
            <p className="text-sm text-muted-foreground">Gestiona las incidencias de las solicitudes</p>
          </div>
          <Button onClick={() => router.push('/empleado/incidencias/nueva')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva incidencia
          </Button>
        </div>

        {/* Tipos de incidencia registrados por el laboratorio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tipos de incidencia del laboratorio</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Tipos disponibles para registrar nuevas incidencias
            </p>
          </CardHeader>
          <CardContent>
            {loadingTipos ? (
              <p className="text-sm text-muted-foreground">Cargando tipos...</p>
            ) : tiposIncidencia.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay tipos de incidencia registrados por el laboratorio
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {tiposIncidencia.map((t) => (
                  <div key={t.id} className="rounded border border-border p-3 text-center">
                    <span className="block text-xs font-medium text-foreground">{t.nombre}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Listado de incidencias</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : incidencias.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay incidencias registradas</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                       <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Código</th>
                       <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Solicitud</th>
                       <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Tipo</th>
                       <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Fecha</th>
                       <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Hora</th>
                       <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Estado</th>
                       <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Responsable</th>
                       <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidencias.map((inc) => (
                      <tr key={inc.id} className="border-b border-border/50 hover:bg-muted/50">
                         <td className="py-2 px-2 font-mono text-xs">{inc.codigo || '—'}</td>
                         <td className="py-2 px-2 font-mono text-xs">{inc.solicitud_codigo_trazabilidad || inc.solicitud_id}</td>
                        <td className="py-2 px-2">{inc.tipo || '—'}</td>
                        <td className="py-2 px-2">{formatFecha(inc.fecha)}</td>
                        <td className="py-2 px-2">{inc.hora || '—'}</td>
                        <td className="py-2 px-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              inc.estado === 'resuelta' || inc.estado === 'cerrada'
                                ? 'bg-green-100 text-green-800'
                                : inc.estado === 'en_proceso'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {inc.estado || 'abierta'}
                          </span>
                        </td>
                        <td className="py-2 px-2">{inc.responsable || '—'}</td>
                        <td className="py-2 px-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/empleado/incidencias/${inc.id}`)}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, Image, Upload } from 'lucide-react'

const ESTADO_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completado', label: 'Completado' },
  { value: 'entregada', label: 'Entregada' },
  { value: 'cancelada', label: 'Cancelada' },
] as const

interface FaseRow {
  id: string
  faseId: string
  nombre: string
  orden: number
  estado: string
  empleadoNombre: string
  fechaFinalizacion: string
  fechaPrueba: string
  evidenciaUrl: string | null
  saving: boolean
}

interface GuardarFasePayload {
  solicitudId: string
  productoFaseId: string
  faseId: string
  nombre: string
  orden: number
  estado: string
  empleadoNombre: string
  fechaFinalizacion: string | null
  fechaPrueba: string | null
  evidenciaFile: File | null
}

interface FasesFabricacionProps {
  solicitudId?: string | null
  productoId?: string | null
  laboratorioId?: string | null
  dientes?: string | null
  cantidad?: number | null
  onSave?: (fase: GuardarFasePayload) => void | Promise<void>
  className?: string
}

const SELECT_CLASS =
  "w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
const DATE_CLASS =
  "rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"

export function FasesFabricacion({
  solicitudId,
  productoId,
  laboratorioId,
  dientes,
  cantidad,
  onSave,
  className,
}: FasesFabricacionProps) {
  const [fases, setFases] = useState<FaseRow[]>([])
  const [empleadoActual, setEmpleadoActual] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [openEvidenceDialog, setOpenEvidenceDialog] = useState(false)
  const [faseParaEvidencia, setFaseParaEvidencia] = useState<FaseRow | null>(null)
  const [evidenciaFile, setEvidenciaFile] = useState<File | null>(null)
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [pfRes, sfRes, evRes] = await Promise.all([
          productoId
            ? supabase
                .from('producto_fases')
                .select('id, producto_id, fase_id, orden')
                .eq('producto_id', productoId)
                .order('orden', { ascending: true })
            : laboratorioId
              ? supabase
                  .from('producto_fases')
                  .select('id, producto_id, fase_id, orden')
                  .order('orden', { ascending: true })
              : supabase.from('producto_fases').select('id, producto_id, fase_id, orden').order('orden', { ascending: true }),
          solicitudId
            ? supabase
                .from('solicitud_fases')
                .select('id, solicitud_id, producto_fase_id, estado, realizado_por, fecha_finalizacion, fecha_prueba')
                .eq('solicitud_id', solicitudId)
            : Promise.resolve({ data: [], error: null }),
          solicitudId
            ? supabase
                .from('fases_evidencias')
                .select('*')
                .eq('solicitud_id', solicitudId)
            : Promise.resolve({ data: [], error: null }),
        ])

        if (!cancelled) {
          const pfRows = (pfRes.data || []) as any[]
          const sfRows = (sfRes.data || []) as any[]
          const evRows = (evRes.data || []) as any[]
          const sfByProductoFase: Record<string, any> = {}
          sfRows.forEach((s) => {
            sfByProductoFase[s.producto_fase_id] = s
          })
          const evByProductoFase: Record<string, any> = {}
          evRows.forEach((e) => {
            evByProductoFase[e.producto_fase_id] = e
          })

          const { data: { user } } = await supabase.auth.getUser()
          let nombreUsuario = ''
          if (user) {
            const { data: emp } = await supabase
              .from('empleados')
              .select('nombre')
              .eq('email', user.email || '')
              .maybeSingle()
            if (emp) nombreUsuario = emp.nombre
          }
          setEmpleadoActual(nombreUsuario)

          let rows: FaseRow[] = []
          if (pfRows.length > 0) {
            const faseIds = pfRows.map((p) => p.fase_id).filter(Boolean)
            let fasesById: Record<string, any> = {}
            if (faseIds.length > 0) {
              const { data: fasesData } = await supabase
                .from('fases')
                .select('id, nombre, orden, empleado_id')
                .in('id', faseIds)
              if (fasesData) {
                fasesData.forEach((f: any) => {
                  fasesById[f.id] = f
                })
              }
            }

            rows = pfRows
              .map((p) => {
                const fase = fasesById[p.fase_id]
                const sf = sfByProductoFase[p.id]
                const ev = evByProductoFase[p.id]
                return {
                  id: p.id,
                  faseId: p.fase_id,
                  nombre: fase?.nombre || p.fase_id || 'Fase',
                  orden: p.orden,
                  estado: sf?.estado || 'pendiente',
                  empleadoNombre: sf?.realizado_por || nombreUsuario || '',
                  fechaFinalizacion: sf?.fecha_finalizacion || '',
                  fechaPrueba: sf?.fecha_prueba || '',
                  evidenciaFile: null,
                  evidenciaUrl: ev?.archivo_url || null,
                  saving: false,
                }
              })
              .sort((a, b) => a.orden - b.orden)
          } else if (laboratorioId) {
            const { data: fasesData } = await supabase
              .from('fases')
              .select('id, nombre, orden, empleado_id')
              .eq('laboratorio_id', laboratorioId)
              .order('orden', { ascending: true })
            rows = (fasesData || []).map((f: any) => ({
              id: f.id,
              faseId: f.id,
              nombre: f.nombre,
              orden: f.orden,
              estado: 'pendiente',
              empleadoNombre: nombreUsuario || '',
              fechaFinalizacion: '',
              fechaPrueba: '',
              evidenciaFile: null,
              evidenciaUrl: null,
              saving: false,
            }))
          }

          setFases(rows)
        }
      } catch (err) {
        console.error('Error cargando fases de fabricación:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [productoId, laboratorioId, solicitudId])

  const handleChangeEstado = useCallback(
    (id: string, value: string) => {
      setFases((prev) =>
        prev.map((f) => (f.id === id ? { ...f, estado: value } : f)),
      )
    },
    [],
  )

  const handleChangeFecha = useCallback(
    (id: string, field: 'fechaFinalizacion' | 'fechaPrueba', value: string) => {
      setFases((prev) =>
        prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
      )
    },
    [],
  )

  const handleSave = async (fase: FaseRow) => {
    setFaseParaEvidencia(fase)
    setOpenEvidenceDialog(true)
  }

  const handleSubirEvidencia = async () => {
    if (!faseParaEvidencia || !evidenciaFile) return
    setSubiendoEvidencia(true)
    try {
      const payload: GuardarFasePayload = {
        solicitudId: solicitudId || '',
        productoFaseId: faseParaEvidencia.id,
        faseId: faseParaEvidencia.faseId,
        nombre: faseParaEvidencia.nombre,
        orden: faseParaEvidencia.orden,
        estado: faseParaEvidencia.estado,
        empleadoNombre: faseParaEvidencia.empleadoNombre,
        fechaFinalizacion: faseParaEvidencia.fechaFinalizacion || null,
        fechaPrueba: faseParaEvidencia.fechaPrueba || null,
        evidenciaFile,
      }
      await onSave?.(payload)
      setFases((prev) =>
        prev.map((f) => (f.id === faseParaEvidencia.id ? { ...f, evidenciaUrl: 'uploaded' } : f)),
      )
      setOpenEvidenceDialog(false)
      setFaseParaEvidencia(null)
      setEvidenciaFile(null)
      setSubiendoEvidencia(false)
    } catch (err: any) {
      setSubiendoEvidencia(false)
      alert('Error al subir la evidencia: ' + (err?.message || 'desconocido'))
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Cargando fases de fabricación…
          </p>
        </CardContent>
      </Card>
    )
  }

  const dientesList = dientes
    ? String(dientes).split(/[\s,]+/).filter(Boolean).join(', ')
    : '—'

  const isCompletado = (estado: string) =>
    estado === 'completado' || estado === 'completada'

  return (
    <>
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-bold">FASES DE FABRICACIÓN</CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Dientes: <span className="font-mono">{dientesList}</span>{' '}
          Cant: <span className="font-mono">{cantidad ?? '—'}</span>
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Estado
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Realizada por
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Fecha finalización
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Fecha prueba
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fases.map((fase) => (
                <tr
                  key={fase.id}
                  className="transition-colors hover:bg-secondary/30"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">{fase.nombre}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={fase.estado}
                      onChange={(e) => handleChangeEstado(fase.id, e.target.value)}
                      className={SELECT_CLASS + ' ' + (isCompletado(fase.estado) ? 'text-green-800 bg-green-50 border-green-300' : '')}
                      disabled={isCompletado(fase.estado)}
                    >
                      {ESTADO_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 min-w-56">
                    <span className="text-sm text-foreground">
                      {fase.empleadoNombre || empleadoActual || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="mm/dd/yyyy"
                      value={fase.fechaFinalizacion}
                      onChange={(e) =>
                        handleChangeFecha(fase.id, 'fechaFinalizacion', e.target.value)
                      }
                      className={DATE_CLASS}
                      disabled={isCompletado(fase.estado)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="mm/dd/yyyy"
                      value={fase.fechaPrueba}
                      onChange={(e) =>
                        handleChangeFecha(fase.id, 'fechaPrueba', e.target.value)
                      }
                      className={DATE_CLASS}
                      disabled={isCompletado(fase.estado)}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Button
                      size="sm"
                      onClick={() => handleSave(fase)}
                      disabled={fase.saving || !!fase.evidenciaUrl || (fase.empleadoNombre && fase.empleadoNombre !== empleadoActual)}
                      className="w-full"
                    >
                      <Save className="size-3 mr-1.5" />
                      {fase.saving ? 'Guardando…' : 'Guardar'}
                    </Button>
                  </td>
                </tr>
              ))}
              {fases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No hay fases disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    {openEvidenceDialog && faseParaEvidencia && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Subir evidencia de fase</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Fase: <span className="font-medium">{faseParaEvidencia.nombre}</span>
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null
              setEvidenciaFile(file)
            }}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          {evidenciaFile && (
            <p className="text-xs text-muted-foreground mb-4">
              {evidenciaFile.name} ({Math.round(evidenciaFile.size / 1024)} KB)
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setOpenEvidenceDialog(false)
                setFaseParaEvidencia(null)
                setEvidenciaFile(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSubirEvidencia}
              disabled={subiendoEvidencia || !evidenciaFile}
            >
              {subiendoEvidencia ? 'Subiendo…' : 'Subir evidencia'}
            </Button>
          </div>
          </div>
        </div>
      )}
    </>
  )
}

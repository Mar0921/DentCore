'use client'

import { useState, useEffect, useCallback, useRef, Fragment } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  productoId: string
  productoNombre: string
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
  productoIds?: string[] | null
  laboratorioId?: string | null
  dientes?: string | null
  cantidad?: number | null
  modo?: 'empleado' | 'laboratorio'
  onSave?: (fase: GuardarFasePayload) => void | Promise<void>
  className?: string
}

const SELECT_CLASS =
  "w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"

export function FasesFabricacion({
  solicitudId,
  productoId,
  productoIds,
  laboratorioId,
  dientes,
  cantidad,
  modo = 'laboratorio',
  onSave,
  className,
}: FasesFabricacionProps) {
  const [fases, setFases] = useState<FaseRow[]>([])
  const [empleadoActual, setEmpleadoActual] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [openEvidenceDialog, setOpenEvidenceDialog] = useState(false)
  const [faseParaEvidencia, setFaseParaEvidencia] = useState<FaseRow | null>(null)
  const [evidenciaFile, setEvidenciaFile] = useState<File | null>(null)
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set())
  const [cameraOpen, setCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!cameraOpen) return
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (cancelled) return
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setCameraOpen(false))
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [cameraOpen])
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [pfRes, sfRes, evRes] = await Promise.all([
          productoIds != null
            ? productoIds.length
              ? supabase
                  .from('producto_fases')
                  .select('id, producto_id, fase_id, orden')
                  .in('producto_id', productoIds)
                  .order('orden', { ascending: true })
              : Promise.resolve({ data: [], error: null })
            : productoId
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

            const productIds = Array.from(new Set(pfRows.map((p: any) => p.producto_id).filter(Boolean)))
            const { data: productosData } = productIds.length
              ? await supabase.from('productos').select('id, titulo, nombre').in('id', productIds)
              : { data: [] as any[] }
            const productosById: Record<string, any> = {}
            ;(productosData || []).forEach((p: any) => {
              productosById[p.id] = p
            })

            rows = pfRows
              .map((p) => {
                const fase = fasesById[p.fase_id]
                const sf = sfByProductoFase[p.id]
                const ev = evByProductoFase[p.id]
                return {
                  id: p.id,
                  productoId: p.producto_id,
                  productoNombre: productosById[p.producto_id]?.titulo || productosById[p.producto_id]?.nombre || 'Producto',
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
              productoId: '',
              productoNombre: 'Fases',
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
          setLockedIds(new Set(rows.filter((r: any) => r.estado === 'completado' || r.estado === 'completada').map((r: any) => r.id)))
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

  // Convierte una fecha arbitraria (ISO, Date, o yyyy-mm-dd) a yyyy-mm-dd para el input type=date
  const toYMD = (value?: string | null): string => {
    if (!value) return ''
    // Si ya viene en formato yyyy-mm-dd (10 chars, guiones en pos 4 y 7)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

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
      if (isCompletado(faseParaEvidencia.estado)) {
        setLockedIds((prev) => new Set(prev).add(faseParaEvidencia.id))
      }
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
            {Object.entries(
              fases.reduce((acc: any, fase: any) => {
                const key = fase.productoId || 'default'
                if (!acc[key]) acc[key] = { nombre: fase.productoNombre || 'Producto', items: [] }
                acc[key].items.push(fase)
                return acc
              }, {}),
            ).map(([pid, group]: any) => (
              <Fragment key={pid}>
                <tr className="bg-secondary/40">
                  <td colSpan={6} className="px-4 py-2 font-semibold text-foreground">
                    {group.nombre}
                  </td>
                </tr>
                {group.items.map((fase: any) => (
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
                      disabled={lockedIds.has(fase.id) || (isCompletado(fase.estado) && !!fase.evidenciaUrl)}
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
                    <Input
                      type="date"
                      value={toYMD(fase.fechaFinalizacion)}
                      onChange={(e) =>
                        handleChangeFecha(fase.id, 'fechaFinalizacion', e.target.value)
                      }
                      className={SELECT_CLASS}
                      disabled={lockedIds.has(fase.id) || (isCompletado(fase.estado) && !!fase.evidenciaUrl)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="date"
                      value={toYMD(fase.fechaPrueba)}
                      onChange={(e) =>
                        handleChangeFecha(fase.id, 'fechaPrueba', e.target.value)
                      }
                      className={SELECT_CLASS}
                      disabled={true}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Button
                      size="sm"
                      onClick={() => handleSave(fase)}
                      disabled={fase.saving}
                      className="w-full"
                    >
                      <Save className="size-3 mr-1.5" />
                      {fase.saving ? 'Guardando…' : 'Guardar'}
                    </Button>
                  </td>
                </tr>
              ))}
              </Fragment>
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
          <div className="flex flex-col gap-2 mb-4 sm:flex-row">
            <label className="flex-1 cursor-pointer rounded-full border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground text-center hover:bg-secondary/50">
              Subir foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setEvidenciaFile(file)
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="flex-1 cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground text-center hover:bg-primary/90"
            >
              Tomar foto
            </button>
          </div>
          {cameraOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
              <div className="bg-card rounded-xl p-4 w-full max-w-md space-y-3">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black" />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCameraOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const video = videoRef.current
                      if (!video) return
                      const canvas = document.createElement('canvas')
                      canvas.width = video.videoWidth
                      canvas.height = video.videoHeight
                      const ctx = canvas.getContext('2d')
                      if (!ctx) return
                      ctx.drawImage(video, 0, 0)
                      canvas.toBlob((blob) => {
                        if (!blob) return
                        const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' })
                        setEvidenciaFile(file)
                        setCameraOpen(false)
                      }, 'image/jpeg', 0.9)
                    }}
                  >
                    Capturar
                  </Button>
                </div>
              </div>
            </div>
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

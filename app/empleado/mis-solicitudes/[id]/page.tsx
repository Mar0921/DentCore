'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DentalChart } from '@/components/dentcore/solicitud/dental-chart'
import { ChevronLeft, RefreshCw, Save, X } from 'lucide-react'
import { AppShell } from '@/components/dentcore/app-shell'
import type { ToothStatus } from '@/components/dentcore/solicitud/solicitud-types'

const GARANTIA_VIEWER_URL = (solicitudId: string) => `/api/garantia?solicitud_id=${encodeURIComponent(solicitudId)}`

function isViewableDocument(nombreArchivo?: string | null, tipoMime?: string | null) {
  if (!nombreArchivo && !tipoMime) return false
  const source = `${nombreArchivo || ''} ${tipoMime || ''}`.toLowerCase()
  return /\.(pdf|jpg|jpeg|png|gif|webp|svg)$/.test(source) || source.includes('pdf') || source.includes('image/')
}

interface FaseLite {
  id: string
  nombre: string
  orden: number
}

interface SolicitudLite {
  id: string
  tipo: string | null
  estado: string | null
  prioridad: string | null
  progreso: number | null
  asignado_a: string | null
  notas: string | null
  odontologonombre: string | null
  odontologo_email: string | null
  odontologo_telefono: string | null
  dientes: string | null
  paciente: string | null
  cc_paciente: string | null
  fecha_entrega: string | null
  firma_odontologo: string | null
  fase_id: string | null
  laboratorio_id: string | null
  created_at: string
  updated_at: string
  registro_medico: string | null
  historia_clinica: string | null
  indicaciones: string | null
  color: string | null
  guia: string | null
  codigo_trazabilidad: string | null
  productos: string | null
  piezas_enviadas: string | null
  archivos: string[] | null
}

const ESTADO_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completada', label: 'Completada' },
  { value: 'entregada', label: 'Entregada' },
  { value: 'cancelada', label: 'Cancelada' },
] as const

const PRIORIDAD_OPTIONS = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
] as const

function parseDientes(dientes?: string | null): number[] {
  if (!dientes) return []
  return Array.from(
    new Set(
      dientes
        .split(/[\s,]+/)
        .map((t) => parseInt(t, 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 48),
    ),
  ).sort((a, b) => a - b)
}

export default function EmpleadoSolicitudDetallePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [solicitud, setSolicitud] = useState<SolicitudLite | null>(null)
  const [fases, setFases] = useState<FaseLite[]>([])
  const [loading, setLoading] = useState(true)

  const SELECT_CLASS =
    "h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
  const [isEditingFase, setIsEditingFase] = useState(false)
  const [selectedFaseId, setSelectedFaseId] = useState<string | null>(null)
  const [savingFase, setSavingFase] = useState(false)
  const [encuestas, setEncuestas] = useState<{
    posAdaptacion: any | null
    buzon: any | null
  }>({ posAdaptacion: null, buzon: null })
  const [garantia, setGarantia] = useState<any | null>(null)
  const [observaciones, setObservaciones] = useState<any[]>([])
  const [nuevaObservacion, setNuevaObservacion] = useState('')
  const [guardandoObservacion, setGuardandoObservacion] = useState(false)
  const [catalogoMateriales, setCatalogoMateriales] = useState<any[]>([])
  const [materialesSolicitud, setMaterialesSolicitud] = useState<any[]>([])
  const [materialSel, setMaterialSel] = useState('')
  const [guardandoMaterial, setGuardandoMaterial] = useState(false)
  const [eliminandoMaterialId, setEliminandoMaterialId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const fetchSolicitud = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/solicitudes?id=${id}&empleado=true`)
        const result = await res.json()
        setSolicitud(result?.data || null)
      } catch {
        setSolicitud(null)
      } finally {
        setLoading(false)
      }
     }
     fetchSolicitud()
   }, [id])

  useEffect(() => {
    if (solicitud) {
      setSelectedFaseId(solicitud.fase_id)
    }
  }, [solicitud])

  useEffect(() => {
    if (!solicitud) return

    async function loadFases() {
      try {
        let { data, error } = await supabase
          .from('fases')
          .select('id, nombre, orden')
          .order('orden', { ascending: true })

        if ((!data || data.length === 0) && solicitud?.laboratorio_id) {
          const retry = await supabase
            .from('fases')
            .select('id, nombre, orden')
            .eq('laboratorio_id', solicitud.laboratorio_id)
            .order('orden', { ascending: true })
          ;({ data, error } = retry)
        }

        if (!error && data && data.length > 0) {
          setFases(data as FaseLite[])
        }
      } catch {
        // ignore
      }
    }
    loadFases()
  }, [solicitud])

  useEffect(() => {
    if (!solicitud) return

    async function loadEncuestas() {
      try {
        const res = await fetch(`/api/encuestas?solicitud_id=${encodeURIComponent(solicitud!.id)}`)
        if (!res.ok) {
          console.error('Error fetching encuestas:', await res.text())
          return
        }
        const result = await res.json()
        setEncuestas({
          posAdaptacion: result.posAdaptacion || null,
          buzon: result.buzon || null,
        })
      } catch (e) {
        console.error('Error loading encuestas:', e)
      }
    }

    loadEncuestas()
  }, [solicitud])

  useEffect(() => {
    if (!solicitud) {
      setObservaciones([])
      return
    }
    let cancelled = false
    async function loadObservaciones() {
      try {
        const res = await fetch(`/api/solicitud-observaciones?solicitud_id=${encodeURIComponent(solicitud!.id)}`)
        if (res.ok) {
          const result = await res.json()
          if (!cancelled && Array.isArray(result?.data)) {
            setObservaciones(result.data)
            return
          }
        }
      } catch (e) {
        console.error('Error loading observaciones:', e)
      }
      // Fallback directo a Supabase
      if (!cancelled) {
        supabase
          .from('solicitud_observaciones')
          .select('id, texto, created_at')
          .eq('solicitud_id', solicitud!.id)
          .order('created_at', { ascending: true })
          .then(({ data, error }) => {
            if (cancelled) return
            if (!error && data) {
              setObservaciones(data)
            }
          })
      }
    }

    loadObservaciones()
    return () => {
      cancelled = true
    }
  }, [solicitud])

  useEffect(() => {
    if (!solicitud?.laboratorio_id) {
      setCatalogoMateriales([])
      return
    }
    let cancelled = false
    supabase
      .from('materiales')
      .select('id, codigo, nombre, material, producto, numero_lote, marca_fabricante, proveedor')
      .eq('laboratorio_id', solicitud.laboratorio_id)
      .order('nombre')
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) {
          setCatalogoMateriales(data)
        } else {
          setCatalogoMateriales([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [solicitud?.laboratorio_id])

  useEffect(() => {
    if (!solicitud) {
      setMaterialesSolicitud([])
      return
    }
    let cancelled = false
    supabase
      .from('solicitud_materiales')
      .select('id, material_id, material, producto, numero_lote, marca_fabricante, proveedor')
      .eq('solicitud_id', solicitud.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) {
          setMaterialesSolicitud(data)
        } else {
          setMaterialesSolicitud([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [solicitud])

  async function handleAgregarMaterial() {
    const cat = catalogoMateriales.find((m) => m.id === materialSel)
    if (!cat || !solicitud?.id || guardandoMaterial) return
    setGuardandoMaterial(true)
    try {
      const { data, error } = await supabase
        .from('solicitud_materiales')
        .insert({
          solicitud_id: solicitud.id,
          material_id: cat.id,
          material: cat.material || cat.nombre,
          producto: cat.producto,
          numero_lote: cat.numero_lote,
          marca_fabricante: cat.marca_fabricante,
          proveedor: cat.proveedor,
        })
        .select('id, material_id, material, producto, numero_lote, marca_fabricante, proveedor')
        .single()
      if (error) throw error
      setMaterialesSolicitud((prev) => [...prev, data])
      setMaterialSel('')
    } catch (e: any) {
      alert('Error al agregar material: ' + (e?.message || 'desconocido'))
    } finally {
      setGuardandoMaterial(false)
    }
  }

  async function handleEliminarMaterial(id: string) {
    if (eliminandoMaterialId) return
    if (!confirm('¿Quitar este material de la solicitud?')) return
    setEliminandoMaterialId(id)
    try {
      const { error } = await supabase.from('solicitud_materiales').delete().eq('id', id)
      if (error) throw error
      setMaterialesSolicitud((prev) => prev.filter((m) => m.id !== id))
    } catch (e: any) {
      alert('Error al quitar material: ' + (e?.message || 'desconocido'))
    } finally {
      setEliminandoMaterialId(null)
    }
  }

  async function handleAgregarObservacion() {
    if (!solicitud || guardandoObservacion) return
    const texto = nuevaObservacion.trim()
    if (!texto) return
    setGuardandoObservacion(true)
    try {
      // Try API first
      const res = await fetch('/api/solicitud-observaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitud_id: solicitud.id,
          texto,
        }),
      })
      if (res.ok) {
        const result = await res.json()
        if (result?.data) {
          setObservaciones((prev) => [...prev, result.data])
          setNuevaObservacion('')
          setGuardandoObservacion(false)
          return
        }
      }
      // Fallback directo a Supabase
      const { data, error } = await supabase
        .from('solicitud_observaciones')
        .insert({ solicitud_id: solicitud!.id, texto })
        .select('id, texto, created_at')
        .single()
      if (error) throw error
      setObservaciones((prev) => [...prev, data])
      setNuevaObservacion('')
    } catch (e: any) {
      alert('Error al agregar observación: ' + e.message)
    } finally {
      setGuardandoObservacion(false)
    }
  }

  const selectedTeeth = useMemo(() => parseDientes(solicitud?.dientes), [solicitud?.dientes])

  const estadoOpt = ESTADO_OPTIONS.find((e) => e.value === solicitud?.estado)
  const prioridadOpt = PRIORIDAD_OPTIONS.find((p) => p.value === solicitud?.prioridad)
  const faseSeleccionada = fases.find((f) => f.id === (selectedFaseId ?? solicitud?.fase_id))
  const faseEnEdicion = fases.find((f) => f.id === selectedFaseId)
  const progresoDerivado = useMemo(() => {
    if (!solicitud) return 0
    const fase = fases.find((f) => f.id === (selectedFaseId ?? solicitud.fase_id))
    if (fase && fases.length > 0) {
      const maxOrden = Math.max(...fases.map((f) => f.orden))
      return Math.round((fase.orden / maxOrden) * 100)
    }
    return solicitud.progreso ?? 0
  }, [selectedFaseId, solicitud?.fase_id, solicitud?.progreso, fases])

  async function handleSaveFase() {
    if (!solicitud || savingFase) return
    if (selectedFaseId === (solicitud.fase_id || null)) {
      setIsEditingFase(false)
      return
    }
    setSavingFase(true)
    try {
      const res = await fetch('/api/solicitudes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: solicitud.id,
          fase_id: selectedFaseId || null,
          progreso: progresoDerivado,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error al guardar la fase')
      setSolicitud((prev) => (prev ? { ...prev, fase_id: selectedFaseId ?? null, progreso: progresoDerivado } : prev))
      setIsEditingFase(false)
    } catch (e: any) {
      alert('Error al guardar la fase: ' + e.message)
    } finally {
      setSavingFase(false)
    }
  }

  function handleCancelFase() {
    setSelectedFaseId(solicitud?.fase_id ?? null)
    setIsEditingFase(false)
  }

  if (loading) {
    return (
      <AppShell sidebar="empleado">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => router.back()}>
              <ChevronLeft className="size-4" />
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold text-primary">Detalle de solicitud</h1>
              <p className="text-sm text-muted-foreground font-mono">#{id}</p>
            </div>
          </div>
          <Card>
            <CardHeader><CardTitle>Cargando…</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Obteniendo los datos de la solicitud.</p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  if (!solicitud) {
    return (
      <AppShell sidebar="empleado">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => router.back()}>
              <ChevronLeft className="size-4" />
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold text-primary">Detalle de solicitud</h1>
              <p className="text-sm text-muted-foreground font-mono">#{id}</p>
            </div>
          </div>
          <Card>
            <CardHeader><CardTitle>No se encontró la solicitud</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No existe una solicitud con el ID <span className="font-mono">{id}</span>.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell sidebar="empleado">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => router.back()}>
              <ChevronLeft className="size-4" />
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold text-primary">Detalle de solicitud</h1>
              <p className="text-sm text-muted-foreground font-mono">#{solicitud.id}</p>
            </div>
          </div>
           <div className="flex items-center gap-2 text-xs">
            {estadoOpt && (
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                {estadoOpt.label}
              </span>
            )}
            {prioridadOpt && (
              <span className="inline-flex rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                {prioridadOpt.label}
              </span>
            )}
            {isEditingFase ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={handleCancelFase}
                  disabled={savingFase}
                >
                  <X className="size-3" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={handleSaveFase}
                  disabled={savingFase}
                >
                  {savingFase ? (
                    <>
                      <RefreshCw className="size-3 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    <>
                      <Save className="size-3" />
                      Guardar fase
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setIsEditingFase(true)}
                disabled={fases.length === 0}
                title="Cambiar fase"
              >
                <RefreshCw className="size-3" />
                Cambiar fase
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información de la solicitud</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Paciente" value={solicitud.paciente || '—'} />
            <InfoRow label="CC. paciente" value={solicitud.cc_paciente || '—'} />
            <InfoRow label="Fecha de entrega" value={solicitud.fecha_entrega || '—'} />
            <InfoRow label="Tipo de trabajo" value={solicitud.tipo || '—'} />
            <InfoRow label="Estado" value={estadoOpt?.label || solicitud.estado || '—'} />
            <InfoRow label="Prioridad" value={prioridadOpt?.label || solicitud.prioridad || '—'} />
            {isEditingFase ? (
              <div className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Fase actual</span>
                <select
                  value={selectedFaseId ?? ''}
                  onChange={(e) => setSelectedFaseId(e.target.value || null)}
                  className={SELECT_CLASS}
                  disabled={fases.length === 0 || savingFase}
                >
                  <option value="">Seleccionar fase…</option>
                  {fases.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.orden}. {f.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <InfoRow
                label="Fase actual"
                value={faseSeleccionada ? `${faseSeleccionada.orden}. ${faseSeleccionada.nombre}` : solicitud.fase_id || '—'}
              />
            )}
            <InfoRow label="Progreso" value={`${progresoDerivado}%`} />
            <InfoRow label="Asignado a" value={solicitud.asignado_a || '—'} />
            <InfoRow label="Odontólogo / Clínica" value={solicitud.odontologonombre || '—'} />
            <InfoRow label="Correo" value={solicitud.odontologo_email || '—'} />
            <InfoRow label="Teléfono" value={solicitud.odontologo_telefono || '—'} />
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Dientes registrados</span>
              <DentalChart
                selectedTeeth={selectedTeeth}
                toothStatuses={{} as Record<number, ToothStatus>}
                onToothSelect={() => {}}
                onToothStatusChange={() => {}}
                onToothStatusClear={() => {}}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Dientes: <span className="font-mono">{solicitud.dientes || '—'}</span>
              </p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Productos</span>
              <span className="text-sm text-foreground whitespace-pre-wrap">{stripPrices(solicitud.productos) || '—'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Piezas enviadas</span>
              <span className="text-sm text-foreground whitespace-pre-wrap">{stripPrices(solicitud.piezas_enviadas) || '—'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Indicaciones</span>
              <span className="text-sm text-foreground whitespace-pre-wrap">{solicitud.indicaciones || '—'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Documentos adjuntos</span>
              {Array.isArray(solicitud.archivos) && solicitud.archivos.length > 0 ? (
                <div className="mt-2 grid gap-2">
                  {solicitud.archivos.map((archivo: string, idx: number) => {
                    const [nombre, url] = archivo.includes('|') ? archivo.split('|') : [archivo, null]
                    const isViewable = isViewableDocument(nombre, null)
                    return (
                      <div key={idx} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                        <span className="text-sm text-foreground">{nombre || archivo}</span>
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-accent underline"
                          >
                            {isViewable ? 'Ver' : 'Descargar'}
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Sin documentos adjuntos</span>
              )}
            </div>
            {solicitud.firma_odontologo ? (
              <div className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Firma del odontólogo</span>
                <img
                  src={solicitud.firma_odontologo}
                  alt="Firma del odontólogo"
                  className="mt-1 max-h-24 w-full max-w-xs rounded-lg border border-border object-contain bg-white"
                />
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Términos de garantía</span>
              {garantia ? (
                <div className="mt-1 rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-sm font-medium text-foreground">Documento disponible</p>
                  <p className="text-xs text-muted-foreground">
                    Archivo: <a href={GARANTIA_VIEWER_URL(solicitud.id)} target="_blank" rel="noreferrer" className="underline">{garantia.nombre_archivo}</a>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Creado: {new Date(garantia.created_at).toLocaleString('es-ES')}
                  </p>
                  {garantia.notas && (
                    <p className="text-xs text-muted-foreground">
                      Notas: {garantia.notas}
                    </p>
                  )}
                  {isViewableDocument(garantia.nombre_archivo, garantia.tipo_mime) && (
                    <iframe
                      src={GARANTIA_VIEWER_URL(solicitud.id)}
                      title={garantia.nombre_archivo || 'Documento de garantía'}
                      className="mt-3 h-[420px] w-full rounded-lg border border-border bg-white"
                    />
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Sin términos de garantía</span>
              )}
            </div>
            <InfoRow label="Creada" value={new Date(solicitud.created_at).toLocaleString('es-ES')} />
            <InfoRow label="Actualizada" value={new Date(solicitud.updated_at).toLocaleString('es-ES')} />
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Notas</span>
              <span className="text-sm text-foreground whitespace-pre-wrap">
                {solicitud.notas || '—'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Materiales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={materialSel}
                onChange={(e) => setMaterialSel(e.target.value)}
                className="flex-1 h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
                disabled={guardandoMaterial || catalogoMateriales.length === 0}
              >
                <option value="">
                  {catalogoMateriales.length === 0 ? 'No hay materiales registrados en el laboratorio' : 'Seleccionar material...'}
                </option>
                {catalogoMateriales
                  .filter((m) => !materialesSolicitud.some((x) => x.material_id === m.id))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {(m.codigo ? m.codigo + ' - ' : '') + (m.nombre || m.material || 'Material')}
                      {m.numero_lote ? ' · Lote ' + m.numero_lote : ''}
                    </option>
                  ))}
              </select>
              <Button
                onClick={handleAgregarMaterial}
                disabled={guardandoMaterial || !materialSel}
                className="sm:self-start"
              >
                {guardandoMaterial ? (
                  <>
                    <RefreshCw className="size-3 animate-spin mr-1" />
                    Agregando…
                  </>
                ) : (
                  'Agregar'
                )}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Material</th>
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Producto</th>
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Número de lote</th>
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Fabricante</th>
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Proveedor</th>
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {materialesSolicitud.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-sm text-muted-foreground">
                        Sin materiales agregados
                      </td>
                    </tr>
                  ) : (
                    materialesSolicitud.map((m) => (
                      <tr key={m.id} className="border-b border-border/50">
                        <td className="py-2 px-2 text-foreground">{m.material || '—'}</td>
                        <td className="py-2 px-2 text-foreground">{m.producto || '—'}</td>
                        <td className="py-2 px-2 text-foreground">{m.numero_lote || '—'}</td>
                        <td className="py-2 px-2 text-foreground">{m.marca_fabricante || '—'}</td>
                        <td className="py-2 px-2 text-foreground">{m.proveedor || '—'}</td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleEliminarMaterial(m.id)}
                            disabled={eliminandoMaterialId === m.id}
                            className="text-xs text-red-600 underline disabled:opacity-50"
                          >
                            {eliminandoMaterialId === m.id ? 'Quitando…' : 'Eliminar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <textarea
                value={nuevaObservacion}
                onChange={(e) => setNuevaObservacion(e.target.value)}
                placeholder="Escribir observación..."
                className="min-h-[80px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
                disabled={guardandoObservacion}
              />
              <Button
                onClick={handleAgregarObservacion}
                disabled={guardandoObservacion || !nuevaObservacion.trim()}
                className="sm:self-start"
              >
                {guardandoObservacion ? (
                  <>
                    <RefreshCw className="size-3 animate-spin mr-1" />
                    Guardando…
                  </>
                ) : (
                  'Agregar'
                )}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Fecha</th>
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {observaciones.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-sm text-muted-foreground">
                        Sin observaciones
                      </td>
                    </tr>
                  ) : (
                    [...observaciones]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((obs) => (
                        <tr key={obs.id} className="border-b border-border/50">
                          <td className="py-2 px-2 align-top whitespace-nowrap text-xs text-muted-foreground">
                            {obs.created_at ? new Date(obs.created_at).toLocaleString('es-ES') : '—'}
                          </td>
                          <td className="py-2 px-2 text-foreground whitespace-pre-wrap">{obs.texto || '—'}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Encuesta posadaptación</span>
              {encuestas.posAdaptacion ? (
                <div className="mt-1 rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-sm font-medium text-foreground">Encuesta registrada</p>
                  <p className="text-xs text-muted-foreground">
                    Creada: {new Date(encuestas.posAdaptacion.created_at).toLocaleString('es-ES')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Paciente: {encuestas.posAdaptacion.nombre_paciente || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Profesional: {encuestas.posAdaptacion.nombre_profesional || encuestas.posAdaptacion.profesional_email || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fecha entrega: {encuestas.posAdaptacion.fecha_entrega_paciente || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Buena adaptación inicial: {encuestas.posAdaptacion.buena_adaptacion_inicial ? 'Sí' : 'No'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Adecuada estética: {encuestas.posAdaptacion.adecuada_estetica ? 'Sí' : 'No'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ajuste oclusal adecuado: {encuestas.posAdaptacion.ajuste_oclusal_adecuado ? 'Sí' : 'No'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Color adecuado: {encuestas.posAdaptacion.color_adecuado ? 'Sí' : 'No'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Opinión general: {encuestas.posAdaptacion.opinion_general || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dispositivo cumple fines: {encuestas.posAdaptacion.dispositivo_cumple_fines || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Paciente conforme: {encuestas.posAdaptacion.paciente_conforme || '—'}
                  </p>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Sin encuesta posadaptación</span>
              )}
            </div>
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Buzón de quejas / reclamos / sugerencias</span>
              {encuestas.buzon ? (
                <div className="mt-1 rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-sm font-medium text-foreground">Solicitud registrada</p>
                  <p className="text-xs text-muted-foreground">
                    Tipo: {encuestas.buzon.tipo || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Estado: {encuestas.buzon.estado === 'pendiente' ? 'Pendiente por contestar' : encuestas.buzon.estado || 'Pendiente por contestar'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Solicitante: {encuestas.buzon.nombre_apellido || encuestas.buzon.correo_electronico || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Descripción: {encuestas.buzon.descripcion || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Notificaciones: {[
                      encuestas.buzon.notificacion_email && 'Correo',
                      encuestas.buzon.notificacion_whatsapp && 'WhatsApp',
                      encuestas.buzon.notificacion_presencial && 'Presencial',
                    ].filter(Boolean).join(', ') || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Comentarios adicionales: {encuestas.buzon.comentarios_adicionales || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Creada: {new Date(encuestas.buzon.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Sin registros en buzón</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="mt-0.5 block text-sm text-foreground break-words">{value}</span>
    </div>
  )
}

function stripPrices(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/a\s*\$\s*[\d.,]+/gi, '')
    .replace(/\$\s*[\d.,]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

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
    if (!solicitud) return

    async function loadGarantia() {
      try {
        const res = await fetch(`/api/documentos-garantia?solicitud_id=${encodeURIComponent(solicitud!.id)}`)
        if (!res.ok) {
          console.error('Error fetching garantia:', await res.text())
          return
        }
        const result = await res.json()
        setGarantia(result.data)
      } catch (e) {
        console.error('Error loading garantia:', e)
      }
    }

    loadGarantia()
  }, [solicitud])

  const selectedTeeth = useMemo(() => parseDientes(solicitud?.dientes), [solicitud?.dientes])

  const estadoOpt = ESTADO_OPTIONS.find((e) => e.value === solicitud?.estado)
  const prioridadOpt = PRIORIDAD_OPTIONS.find((p) => p.value === solicitud?.prioridad)
  const faseSeleccionada = fases.find((f) => f.id === selectedFaseId ?? solicitud?.fase_id)
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
            <CardTitle className="text-base">Documentos de la solicitud</CardTitle>
          </CardHeader>
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

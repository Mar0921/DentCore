'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DentalChart } from '@/components/dentcore/solicitud/dental-chart'
import { ChevronLeft } from 'lucide-react'
import { AppShell } from '@/components/dentcore/app-shell'
import type { ToothStatus } from '@/components/dentcore/solicitud/solicitud-types'

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

const GARANTIA_VIEWER_URL = (solicitudId: string) => `/api/garantia?solicitud_id=${encodeURIComponent(solicitudId)}`

function isViewableDocument(nombreArchivo?: string | null, tipoMime?: string | null) {
  if (!nombreArchivo && !tipoMime) return false
  const source = `${nombreArchivo || ''} ${tipoMime || ''}`.toLowerCase()
  return /\.(pdf|jpg|jpeg|png|gif|webp|svg)$/.test(source) || source.includes('pdf') || source.includes('image/')
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

const POS_ITEMS = [
  { key: 'buena_adaptacion_inicial', label: 'Buena adaptación inicial' },
  { key: 'adecuada_estetica', label: 'Adecuada estética' },
  { key: 'ajuste_oclusal_adecuado', label: 'Ajuste oclusal adecuado' },
  { key: 'color_adecuado', label: 'Color adecuado' },
] as const

const TIPOS_BUZON = [
  { value: 'queja', label: 'QUEJA' },
  { value: 'reclamo', label: 'RECLAMO' },
  { value: 'sugerencia', label: 'SUGERENCIA' },
  { value: 'felicitacion', label: 'FELICITACIÓN' },
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

export default function InvitadoSolicitudDetallePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [solicitud, setSolicitud] = useState<SolicitudLite | null>(null)
  const [fases, setFases] = useState<FaseLite[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeethState, setSelectedTeethState] = useState<number[]>([])

  const [posForm, setPosForm] = useState({
    email: '',
    paciente: '',
    buena_adaptacion_inicial: false,
    adecuada_estetica: false,
    ajuste_oclusal_adecuado: false,
    color_adecuado: false,
    opinion_general: '',
    dispositivo_cumple_fines: '',
    paciente_conforme: '',
    nombre_profesional: '',
    fecha_entrega: '',
  })
  const [posEnviada, setPosEnviada] = useState(false)
  const [posError, setPosError] = useState('')
  const [posLoading, setPosLoading] = useState(false)

  const [buzonForm, setBuzonForm] = useState({
    tipo: '',
    descripcion: '',
    notificacion_email: false,
    notificacion_whatsapp: false,
    notificacion_presencial: false,
    nombre_apellido: '',
    correo_electronico: '',
    comentarios_adicionales: '',
  })
  const [buzonEnviado, setBuzonEnviado] = useState(false)
  const [buzonError, setBuzonError] = useState('')
  const [buzonLoading, setBuzonLoading] = useState(false)
  const [garantia, setGarantia] = useState<any | null>(null)

  useEffect(() => {
    if (!id) return
    const fetchSolicitud = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/solicitudes?id=${id}`)
        const result = await res.json()
        const found = result?.data || null
        setSolicitud(found)
      } catch {
        setSolicitud(null)
      } finally {
        setLoading(false)
      }
    }
    fetchSolicitud()
  }, [id])

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

    setPosForm((prev) => ({
      ...prev,
      email: prev.email || solicitud.odontologo_email || '',
      paciente: prev.paciente || solicitud.paciente || '',
      nombre_profesional: prev.nombre_profesional || solicitud.odontologonombre || '',
    }))

    setBuzonForm((prev) => ({
      ...prev,
      nombre_apellido: prev.nombre_apellido || solicitud.odontologonombre || '',
      correo_electronico: prev.correo_electronico || solicitud.odontologo_email || '',
    }))
  }, [solicitud?.id, solicitud?.odontologo_email, solicitud?.paciente, solicitud?.odontologonombre])

  useEffect(() => {
    if (solicitud) {
      setSelectedTeethState(parseDientes(solicitud.dientes))
    }
  }, [solicitud])

  useEffect(() => {
    if (!solicitud) return

    async function loadGarantia() {
      try {
        const res = await fetch(`/api/documentos-garantia?solicitud_id=${encodeURIComponent(solicitud.id)}`)
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
  }, [solicitud?.id])

  const selectedTeeth = useMemo(() => parseDientes(solicitud?.dientes), [solicitud?.dientes])

  const estadoOpt = ESTADO_OPTIONS.find((e) => e.value === solicitud?.estado)
  const prioridadOpt = PRIORIDAD_OPTIONS.find((p) => p.value === solicitud?.prioridad)
  const faseSeleccionada = fases.find((f) => f.id === solicitud?.fase_id)
  const progresoDerivado = useMemo(() => {
    if (!solicitud) return 0
    const fase = fases.find((f) => f.id === solicitud.fase_id)
    if (fase && fases.length > 0) {
      const maxOrden = Math.max(...fases.map((f) => f.orden))
      return Math.round((fase.orden / maxOrden) * 100)
    }
    return solicitud.progreso ?? 0
  }, [solicitud?.fase_id, solicitud?.progreso, fases])

  const handlePosSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPosLoading(true)
    setPosError('')

    try {
      const { error: insertError } = await supabase.from('encuestas_pos_adaptacion').insert({
        solicitud_id: solicitud?.id || null,
        profesional_email: posForm.email || null,
        nombre_paciente: posForm.paciente || solicitud?.paciente || null,
        buena_adaptacion_inicial: posForm.buena_adaptacion_inicial || null,
        adecuada_estetica: posForm.adecuada_estetica || null,
        ajuste_oclusal_adecuado: posForm.ajuste_oclusal_adecuado || null,
        color_adecuado: posForm.color_adecuado || null,
        opinion_general: posForm.opinion_general || null,
        dispositivo_cumple_fines: posForm.dispositivo_cumple_fines || null,
        paciente_conforme: posForm.paciente_conforme || null,
        nombre_profesional: posForm.nombre_profesional || null,
        fecha_entrega_paciente: posForm.fecha_entrega || null,
      })

      if (insertError) {
        setPosError(insertError.message)
      } else {
        setPosEnviada(true)
      }
    } catch {
      setPosError('Error al guardar la encuesta')
    } finally {
      setPosLoading(false)
    }
  }

  const handleBuzonSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBuzonLoading(true)
    setBuzonError('')

    try {
      const { error: insertError } = await supabase.from('buzon_quejas').insert({
        solicitud_id: solicitud?.id || null,
        tipo: buzonForm.tipo || null,
        descripcion: buzonForm.descripcion || null,
        notificacion_email: buzonForm.notificacion_email,
        notificacion_whatsapp: buzonForm.notificacion_whatsapp,
        notificacion_presencial: buzonForm.notificacion_presencial,
        nombre_apellido: buzonForm.nombre_apellido || null,
        correo_electronico: buzonForm.correo_electronico || null,
        comentarios_adicionales: buzonForm.comentarios_adicionales || null,
        estado: 'pendiente',
      })

      if (insertError) {
        setBuzonError(insertError.message)
      } else {
        setBuzonEnviado(true)
      }
    } catch {
      setBuzonError('Error al guardar la solicitud')
    } finally {
      setBuzonLoading(false)
    }
  }

  if (loading) {
    return (
      <AppShell sidebar="invitado" showSidebar={false}>
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
      <AppShell sidebar="invitado" showSidebar={false}>
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
    <AppShell sidebar="invitado" showSidebar={false}>
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
            <InfoRow
              label="Fase actual"
              value={faseSeleccionada ? `${faseSeleccionada.orden}. ${faseSeleccionada.nombre}` : solicitud.fase_id || '—'}
            />
            <InfoRow label="Progreso" value={`${progresoDerivado}%`} />
            <InfoRow label="Asignado a" value={solicitud.asignado_a || '—'} />
            <InfoRow label="Odontólogo / Clínica" value={solicitud.odontologonombre || '—'} />
            <InfoRow label="Correo" value={solicitud.odontologo_email || '—'} />
            <InfoRow label="Teléfono" value={solicitud.odontologo_telefono || '—'} />
            <InfoRow label="Registro médico" value={solicitud.registro_medico || '—'} />
            <InfoRow label="Historia clínica" value={solicitud.historia_clinica || '—'} />
            <InfoRow label="Código de trazabilidad" value={solicitud.codigo_trazabilidad || '—'} />
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
              <span className="text-sm text-foreground whitespace-pre-wrap">{solicitud.productos || '—'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Piezas enviadas</span>
              <span className="text-sm text-foreground whitespace-pre-wrap">{solicitud.piezas_enviadas || '—'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Indicaciones</span>
              <span className="text-sm text-foreground whitespace-pre-wrap">{solicitud.indicaciones || '—'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Documentos adjuntos</span>
              {Array.isArray(solicitud.archivos) && solicitud.archivos.length > 0 ? (
                <ul className="list-disc pl-5 text-sm text-foreground">
                  {solicitud.archivos.map((archivo: string, idx: number) => (
                    <li key={idx}>{archivo}</li>
                  ))}
                </ul>
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
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Encuesta posadaptación</span>
              {posEnviada ? (
                <p className="text-sm text-green-600">Encuesta enviada correctamente</p>
              ) : (
                <form className="mt-2 grid gap-3" onSubmit={handlePosSubmit}>
                  <Input
                    type="email"
                    placeholder="Email del profesional tratante"
                    value={posForm.email}
                    onChange={(e) => setPosForm({ ...posForm, email: e.target.value })}
                  />
                  <Input
                    placeholder="Nombre del paciente"
                    value={posForm.paciente}
                    onChange={(e) => setPosForm({ ...posForm, paciente: e.target.value })}
                  />
                  <div className="grid gap-1.5">
                    <label className="text-xs text-muted-foreground">Evaluación clínica posentrega</label>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {POS_ITEMS.map((item) => (
                        <label key={item.key} className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={!!posForm[item.key as keyof typeof posForm]}
                            onChange={(e) =>
                              setPosForm({ ...posForm, [item.key]: e.target.checked } as any)
                            }
                          />
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    placeholder="Opinión general del profesional tratante"
                    value={posForm.opinion_general}
                    onChange={(e) => setPosForm({ ...posForm, opinion_general: e.target.value })}
                  />
                  <Textarea
                    placeholder="El dispositivo cumple con los fines terapéuticos previstos"
                    value={posForm.dispositivo_cumple_fines}
                    onChange={(e) => setPosForm({ ...posForm, dispositivo_cumple_fines: e.target.value })}
                  />
                  <Textarea
                    placeholder="El paciente se encuentra conforme con el tratamiento"
                    value={posForm.paciente_conforme}
                    onChange={(e) => setPosForm({ ...posForm, paciente_conforme: e.target.value })}
                  />
                  <Input
                    placeholder="Registrar nombre del profesional"
                    value={posForm.nombre_profesional}
                    onChange={(e) => setPosForm({ ...posForm, nombre_profesional: e.target.value })}
                  />
                  <Input
                    type="date"
                    placeholder="Fecha de entrega al paciente"
                    value={posForm.fecha_entrega}
                    onChange={(e) => setPosForm({ ...posForm, fecha_entrega: e.target.value })}
                  />
                  {posError && <p className="text-xs text-destructive">{posError}</p>}
                  <Button type="submit" size="sm" disabled={posLoading}>
                    {posLoading ? 'Enviando...' : 'Enviar Encuesta'}
                  </Button>
                </form>
              )}
            </div>

            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Buzón de quejas / reclamos / sugerencias</span>
              {buzonEnviado ? (
                <p className="text-sm text-green-600">Solicitud enviada correctamente</p>
              ) : (
                <form className="mt-2 grid gap-3" onSubmit={handleBuzonSubmit}>
                  <select
                    value={buzonForm.tipo}
                    onChange={(e) => setBuzonForm({ ...buzonForm, tipo: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="">Seleccionar tipo...</option>
                    {TIPOS_BUZON.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <Textarea
                    placeholder="Describa su solicitud..."
                    value={buzonForm.descripcion}
                    onChange={(e) => setBuzonForm({ ...buzonForm, descripcion: e.target.value })}
                  />
                  <div className="grid gap-1.5">
                    <label className="text-xs text-muted-foreground">Como desea ser notificado</label>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={buzonForm.notificacion_email}
                          onChange={(e) => setBuzonForm({ ...buzonForm, notificacion_email: e.target.checked })}
                        />
                        Correo electrónico
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={buzonForm.notificacion_whatsapp}
                          onChange={(e) => setBuzonForm({ ...buzonForm, notificacion_whatsapp: e.target.checked })}
                        />
                        Vía whatsapp
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={buzonForm.notificacion_presencial}
                          onChange={(e) => setBuzonForm({ ...buzonForm, notificacion_presencial: e.target.checked })}
                        />
                        Presencial
                      </label>
                    </div>
                  </div>
                  <Input
                    placeholder="Nombre y apellido"
                    value={buzonForm.nombre_apellido}
                    onChange={(e) => setBuzonForm({ ...buzonForm, nombre_apellido: e.target.value })}
                  />
                  <Input
                    type="email"
                    placeholder="Correo electrónico"
                    value={buzonForm.correo_electronico}
                    onChange={(e) => setBuzonForm({ ...buzonForm, correo_electronico: e.target.value })}
                  />
                  <Textarea
                    placeholder="Comentarios adicionales..."
                    value={buzonForm.comentarios_adicionales}
                    onChange={(e) => setBuzonForm({ ...buzonForm, comentarios_adicionales: e.target.value })}
                  />
                  {buzonError && <p className="text-xs text-destructive">{buzonError}</p>}
                  <Button type="submit" size="sm" disabled={buzonLoading}>
                    {buzonLoading ? 'Enviando...' : 'Enviar'}
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

function InfoRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="mt-0.5 block text-sm text-foreground break-words">{value}</span>
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DentalChart } from '@/components/dentcore/solicitud/dental-chart'
import { ChevronLeft, Save, RefreshCw, Upload } from 'lucide-react'
import type { ToothStatus } from '@/components/dentcore/solicitud/solicitud-types'

const GARANTIA_VIEWER_URL = (solicitudId: string) => `/api/garantia?solicitud_id=${encodeURIComponent(solicitudId)}`

function isViewableDocument(nombreArchivo?: string | null, tipoMime?: string | null) {
  if (!nombreArchivo && !tipoMime) return false
  const source = `${nombreArchivo || ''} ${tipoMime || ''}`.toLowerCase()
  return /\.(pdf|jpg|jpeg|png|gif|webp|svg)$/.test(source) || source.includes('pdf') || source.includes('image/')
}

type Estado = 'pendiente' | 'en_progreso' | 'completada' | 'entregada' | 'cancelada'
type Prioridad = 'baja' | 'media' | 'alta' | 'urgente'

interface FaseLite {
  id: string
  nombre: string
  orden: number
}

interface SolicitudEditable {
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

const SELECT_CLASS =
  "h-10 w-full rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"

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

export default function SolicitudDetallePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [solicitud, setSolicitud] = useState<SolicitudEditable | null>(null)
  const [fases, setFases] = useState<FaseLite[]>([])
  const [form, setForm] = useState<Partial<SolicitudEditable>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTeethState, setSelectedTeethState] = useState<number[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [encuestas, setEncuestas] = useState<{
    posAdaptacion: any | null
    buzon: any | null
  }>({ posAdaptacion: null, buzon: null })
  const [garantia, setGarantia] = useState<any | null>(null)
  const [garantiaNotas, setGarantiaNotas] = useState('')
  const [garantiaLoading, setGarantiaLoading] = useState(false)
  const [garantiaFile, setGarantiaFile] = useState<File | null>(null)
  const garantiaInputRef = useRef<HTMLInputElement>(null)
  const firmaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return
    const fetchSolicitud = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/solicitudes?id=${id}`)
        const result = await res.json()
        const found = result?.data || null
        setSolicitud(found)
        if (found) setForm(mapForm(found))
      } catch {
        setSolicitud(null)
        setForm({})
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

        if ((!data || data.length === 0) && solicitud.laboratorio_id) {
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
        const res = await fetch(`/api/encuestas?solicitud_id=${encodeURIComponent(solicitud.id)}`)
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
        const res = await fetch(`/api/documentos-garantia?solicitud_id=${encodeURIComponent(solicitud.id)}`)
        if (!res.ok) {
          console.error('Error fetching garantia:', await res.text())
          return
        }
        const result = await res.json()
        setGarantia(result.data)
        if (result.data?.notas) {
          setGarantiaNotas(result.data.notas)
        }
      } catch (e) {
        console.error('Error loading garantia:', e)
      }
    }

    loadGarantia()
  }, [solicitud])

  async function handleGarantiaSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!solicitud || !garantiaFile) return
    setGarantiaLoading(true)

    try {
      const formData = new FormData()
      formData.append('archivo', garantiaFile)
      formData.append('solicitud_id', solicitud.id)
      formData.append('laboratorio_id', solicitud.laboratorio_id || '')
      formData.append('notas', garantiaNotas)

      const res = await fetch('/api/documentos-garantia', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error al guardar')

      setGarantia(result.data)
      setGarantiaFile(null)
      if (garantiaInputRef.current) {
        garantiaInputRef.current.value = ''
      }
    } catch (e) {
      alert('Error al guardar: ' + (e as any).message)
    } finally {
      setGarantiaLoading(false)
    }
  }

  async function handleGarantiaDelete() {
    if (!solicitud) return
    if (!confirm('¿Eliminar documento de garantía?')) return

    try {
      const res = await fetch(`/api/documentos-garantia?solicitud_id=${encodeURIComponent(solicitud.id)}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Error al eliminar')
      }

      setGarantia(null)
      setGarantiaNotas('')
      setGarantiaFile(null)
      if (garantiaInputRef.current) {
        garantiaInputRef.current.value = ''
      }
    } catch (e) {
      alert('Error al eliminar: ' + (e as any).message)
    }
  }

  function mapForm(s: SolicitudEditable) {
    return {
      tipo: s.tipo ?? '',
      estado: (s.estado as Estado) || 'pendiente',
      prioridad: (s.prioridad as Prioridad) || 'media',
      progreso: s.progreso ?? 0,
      asignado_a: s.asignado_a ?? '',
      notas: s.notas ?? '',
      paciente: s.paciente ?? '',
      cc_paciente: s.cc_paciente ?? '',
      fecha_entrega: s.fecha_entrega ?? '',
      firma_odontologo: s.firma_odontologo ?? '',
      fase_id: s.fase_id ?? null,
    }
  }

  const progresoDerivado = useMemo(() => {
    const fase = fases.find((f) => f.id === form.fase_id)
    if (fase && fases.length > 0) {
      const maxOrden = Math.max(...fases.map((f) => f.orden))
      return Math.round((fase.orden / maxOrden) * 100)
    }
    return Number(form.progreso ?? solicitud?.progreso ?? 0)
  }, [form.fase_id, form.progreso, fases, solicitud?.progreso])

  const selectedTeeth = useMemo(() => parseDientes(solicitud?.dientes), [solicitud?.dientes])

  useEffect(() => {
    syncTeethFromSolicitud()
  }, [solicitud])

  function syncTeethFromSolicitud() {
    setSelectedTeethState(solicitud ? parseDientes(solicitud.dientes) : [])
  }

  function toggleTooth(n: number) {
    setSelectedTeethState((prev) => {
      const exists = prev.includes(n)
      const next = exists ? prev.filter((t) => t !== n) : [...prev, n]
      return next.sort((a, b) => a - b)
    })
  }

  function clearTooth(n: number) {
    setSelectedTeethState((prev) => prev.filter((t) => t !== n))
  }

  function handleFirmaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setField('firma_odontologo', dataUrl)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function setField<K extends keyof typeof form>(field: K, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleFaseChange = (faseId: string) => {
    setField('fase_id', faseId || null)
  }

  const handleSave = async () => {
    if (!solicitud || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/solicitudes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: solicitud.id,
          ...form,
          dientes: selectedTeethState.join(', ') || null,
          progreso: progresoDerivado,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error al guardar')
      const updated = result.data
      setSolicitud(updated)
      setForm((prev) => ({ ...prev, ...mapForm(updated), progreso: updated.progreso ?? prev.progreso }))
      setIsEditing(false)
    } catch (e) {
      alert('Error al guardar: ' + (e as any).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Header backOnClick={() => router.back()} title="Detalle de solicitud" subtitle={`#${id}`} />
        <Card>
          <CardHeader><CardTitle>Cargando…</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Obteniendo los datos de la solicitud.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!solicitud) {
    return (
      <div className="space-y-4">
        <Header backOnClick={() => router.back()} title="Detalle de solicitud" subtitle={`#${id}`} />
        <Card>
          <CardHeader><CardTitle>No se encontró la solicitud</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No existe una solicitud con el ID <span className="font-mono">{id}</span>.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const estadoOpt = ESTADO_OPTIONS.find((e) => e.value === form.estado)
  const prioridadOpt = PRIORIDAD_OPTIONS.find((p) => p.value === form.prioridad)
  const faseSeleccionada = fases.find((f) => f.id === form.fase_id)

  return (
    <div className="space-y-4">
      <Header
        backOnClick={() => router.back()}
        title="Detalle de solicitud"
        subtitle={`#${solicitud.id}`}
        badges={{
          estado: estadoOpt?.label || form.estado || '',
          prioridad: prioridadOpt?.label || form.prioridad || '',
        }}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing((prev) => !prev)}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isEditing ? 'Edición' : 'Detalle de solicitud'}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {isEditing
              ? 'Modifique los campos y guarde los cambios. El progreso se calcula según la fase del proceso.'
              : 'Información registrada de la solicitud. Presione "Editar" para realizar cambios.'}
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {isEditing ? (
            <>
              <div className="grid gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-primary">Paciente</label>
                <Input
                  value={form.paciente ?? ''}
                  onChange={(e) => setField('paciente', e.target.value)}
                  placeholder="Nombre del paciente"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">CC. paciente</label>
                <Input
                  value={form.cc_paciente ?? ''}
                  onChange={(e) => setField('cc_paciente', e.target.value)}
                  placeholder="Documento de identidad"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Fecha de entrega</label>
                <Input
                  value={form.fecha_entrega ?? ''}
                  onChange={(e) => setField('fecha_entrega', e.target.value)}
                  placeholder="dd/mm/aaaa"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Tipo de trabajo</label>
                <Input
                  value={form.tipo ?? ''}
                  onChange={(e) => setField('tipo', e.target.value)}
                  placeholder="Ej. Corona de zirconia"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Estado</label>
                <select
                  value={form.estado ?? 'pendiente'}
                  onChange={(e) => setField('estado', e.target.value as Estado)}
                  className={SELECT_CLASS}
                >
                  {ESTADO_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Prioridad</label>
                <select
                  value={form.prioridad ?? 'media'}
                  onChange={(e) => setField('prioridad', e.target.value as Prioridad)}
                  className={SELECT_CLASS}
                >
                  {PRIORIDAD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Fase actual</label>
                <select
                  value={form.fase_id ?? ''}
                  onChange={(e) => handleFaseChange(e.target.value)}
                  className={SELECT_CLASS}
                  disabled={fases.length === 0}
                >
                  <option value="">Seleccionar fase…</option>
                  {fases.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.orden}. {f.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Progreso (%)</label>
                <Input type="number" min={0} max={100} value={progresoDerivado} disabled />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Asignado a</label>
                <Input
                  value={form.asignado_a ?? ''}
                  onChange={(e) => setField('asignado_a', e.target.value)}
                  placeholder="Nombre del técnico"
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Odontólogo / Clínica</label>
                <Input value={solicitud.odontologonombre ?? ''} disabled />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Correo</label>
                <Input type="email" value={solicitud.odontologo_email ?? ''} disabled />
              </div>
              <div className="grid gap-1.5">
                <label className="text-sm font-medium text-primary">Teléfono</label>
                <Input value={solicitud.odontologo_telefono ?? ''} disabled />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-primary">Dientes (haga clic para marcar / desmarcar)</label>
                <DentalChart
                  selectedTeeth={selectedTeethState}
                  toothStatuses={{} as Record<number, ToothStatus>}
                  onToothSelect={toggleTooth}
                  onToothStatusChange={() => {}}
                  onToothStatusClear={clearTooth}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Dientes: <span className="font-mono">{selectedTeethState.join(', ') || '—'}</span>
                </p>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-primary">Notas</label>
                <Textarea
                  value={form.notas ?? ''}
                  onChange={(e) => setField('notas', e.target.value)}
                  placeholder="Notas de la solicitud..."
                  rows={4}
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-primary">Firma del odontólogo</label>
                <div className="flex items-center gap-3">
                  <input
                    ref={firmaInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFirmaChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => firmaInputRef.current?.click()}
                  >
                    <Upload className="size-4" />
                    Subir firma
                  </Button>
                  {form.firma_odontologo ? (
                    <img
                      src={form.firma_odontologo}
                      alt="Firma"
                      className="h-16 w-auto rounded-lg border border-border bg-white object-contain"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin firma</span>
                  )}
                </div>
                {form.firma_odontologo && (
                  <button
                    type="button"
                    className="text-left text-xs underline text-muted-foreground"
                    onClick={() => setField('firma_odontologo', '')}
                  >
                    Quitar firma
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-1.5 sm:col-span-2">
                <span className="text-xs text-muted-foreground">Paciente</span>
                <span className="text-sm text-foreground">{solicitud.paciente || '—'}</span>
              </div>
              <div className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">CC. paciente</span>
                <span className="text-sm text-foreground">{solicitud.cc_paciente || '—'}</span>
              </div>
              <div className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">Fecha de entrega</span>
                <span className="text-sm text-foreground">{solicitud.fecha_entrega || '—'}</span>
              </div>
              <div className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">Tipo de trabajo</span>
                <span className="text-sm text-foreground">{solicitud.tipo || '—'}</span>
              </div>
              <div className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">Estado</span>
                <span className="text-sm text-foreground">{estadoOpt?.label || solicitud.estado || '—'}</span>
              </div>
              <div className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">Prioridad</span>
                <span className="text-sm text-foreground">{prioridadOpt?.label || solicitud.prioridad || '—'}</span>
              </div>
              <div className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">Fase actual</span>
                <span className="text-sm text-foreground">
                  {faseSeleccionada ? `${faseSeleccionada.orden}. ${faseSeleccionada.nombre}` : solicitud.fase_id || '—'}
                </span>
              </div>
              <div className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">Progreso (%)</span>
                <span className="text-sm text-foreground">{progresoDerivado}%</span>
              </div>
              <div className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">Asignado a</span>
                <span className="text-sm text-foreground">{solicitud.asignado_a || '—'}</span>
              </div>
              <div className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">Odontólogo / Clínica</span>
                <span className="text-sm text-foreground">{solicitud.odontologonombre || '—'}</span>
              </div>
              <div className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">Correo</span>
                <span className="text-sm text-foreground">{solicitud.odontologo_email || '—'}</span>
              </div>
              <div className="grid gap-1.5">
                <span className="text-xs text-muted-foreground">Teléfono</span>
                <span className="text-sm text-foreground">{solicitud.odontologo_telefono || '—'}</span>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <span className="text-xs text-muted-foreground">Productos</span>
                <span className="text-sm text-foreground whitespace-pre-wrap">{solicitud.productos || '—'}</span>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <span className="text-xs text-muted-foreground">Piezas enviadas</span>
                <span className="text-sm text-foreground whitespace-pre-wrap">{solicitud.piezas_enviadas || '—'}</span>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <span className="text-xs text-muted-foreground">Indicaciones</span>
                <span className="text-sm text-foreground whitespace-pre-wrap">{solicitud.indicaciones || '—'}</span>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
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
              <div className="grid gap-1.5 sm:col-span-2">
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
              <div className="grid gap-1.5 sm:col-span-2">
                <span className="text-xs text-muted-foreground">Notas</span>
                <span className="text-sm text-foreground whitespace-pre-wrap">
                  {solicitud.notas || '—'}
                </span>
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <span className="text-xs text-muted-foreground">Firma del odontólogo</span>
                {solicitud.firma_odontologo ? (
                  <img
                    src={solicitud.firma_odontologo}
                    alt="Firma del odontólogo"
                    className="mt-1 max-h-24 w-full max-w-xs rounded-lg border border-border object-contain bg-white"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">Sin firma</span>
                )}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t border-border">
          <Button variant="outline" onClick={() => isEditing ? setIsEditing(false) : router.back()}>Cancelar</Button>
          {isEditing ? (
            <Button className="gap-2" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          ) : (
            <Button className="gap-2" onClick={() => setIsEditing(true)}>
              <Save className="size-4" />
              Editar
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentos de la solicitud</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Términos de garantía</span>
            {garantia ? (
              <div className="mt-1 rounded-lg border border-border bg-secondary/30 p-3">
                <p className="text-sm font-medium text-foreground">Documento cargado</p>
                <p className="text-xs text-muted-foreground">
                  Archivo: <a href={GARANTIA_VIEWER_URL(solicitud.id)} target="_blank" rel="noreferrer" className="underline">{garantia.nombre_archivo}</a>
                </p>
                <p className="text-xs text-muted-foreground">
                  Creado: {new Date(garantia.created_at).toLocaleString('es-ES')}
                </p>
                {garantiaNotas && (
                  <p className="text-xs text-muted-foreground">
                    Notas: {garantiaNotas}
                  </p>
                )}
                {isViewableDocument(garantia.nombre_archivo, garantia.tipo_mime) && (
                  <iframe
                    src={GARANTIA_VIEWER_URL(solicitud.id)}
                    title={garantia.nombre_archivo || 'Documento de garantía'}
                    className="mt-3 h-[420px] w-full rounded-lg border border-border bg-white"
                  />
                )}
                <Button variant="outline" size="sm" className="mt-2" onClick={handleGarantiaDelete}>
                  Eliminar
                </Button>
              </div>
            ) : (
              <form className="mt-2 grid gap-3" onSubmit={handleGarantiaSubmit}>
                <input
                  ref={garantiaInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setGarantiaFile(e.target.files?.[0] || null)}
                />
                <Textarea
                  placeholder="Notas del documento de garantía"
                  value={garantiaNotas}
                  onChange={(e) => setGarantiaNotas(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => garantiaInputRef.current?.click()}>
                    Seleccionar archivo
                  </Button>
                  {garantiaFile && <span className="text-xs text-muted-foreground self-center">{garantiaFile.name}</span>}
                </div>
                <Button type="submit" size="sm" disabled={garantiaLoading || !garantiaFile}>
                  {garantiaLoading ? 'Subiendo...' : 'Subir términos de garantía'}
                </Button>
              </form>
            )}
          </div>
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
  )
}

function Header({
  backOnClick,
  title,
  subtitle,
  badges,
  isEditing,
  onToggleEdit,
}: {
  backOnClick: () => void
  title: string
  subtitle: string
  badges?: { estado?: string; prioridad?: string }
  isEditing?: boolean
  onToggleEdit?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="size-8" onClick={backOnClick}>
          <ChevronLeft className="size-4" />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">{title}</h1>
          <p className="text-sm text-muted-foreground font-mono">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badges ? (
          <div className="flex items-center gap-2 text-xs">
            {badges.estado ? (
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                {badges.estado}
              </span>
            ) : null}
            {badges.prioridad ? (
              <span className="inline-flex rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                {badges.prioridad}
              </span>
            ) : null}
          </div>
        ) : null}
        {onToggleEdit && (
          <Button variant="outline" size="sm" onClick={onToggleEdit}>
            {isEditing ? 'Cancelar edición' : 'Editar'}
          </Button>
        )}
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  className,
}: {
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="mt-0.5 block text-sm text-foreground break-words">{value}</span>
    </div>
  )
}

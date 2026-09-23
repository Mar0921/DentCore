'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, CalendarDays, Clock, User, AlertCircle } from 'lucide-react'

interface SolicitudCalendario {
  id: string
  paciente: string
  prioridad: 'alta' | 'media' | 'baja'
  fecha_entrega: string | null
  estado: string
  progreso: number
  odontologonombre?: string
  codigo_trazabilidad?: string
  diasRestantes: number
}

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function dateToLocalKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getDaysRemaining(fechaEntrega: string | null): number {
  if (!fechaEntrega) return 9999
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(fechaEntrega + 'T00:00:00')
  const diffMs = target.getTime() - today.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function getColorByProximity(dias: number): string {
  if (dias < 0) return 'rojo'
  if (dias < 2) return 'rojo'
  if (dias <= 5) return 'amarillo'
  return 'verde'
}

const COLOR_CLASSES: Record<string, { card: string; dot: string; label: string }> = {
  rojo: {
    card: 'bg-red-500/15 border-red-500/30 text-red-700',
    dot: 'bg-red-500',
    label: 'Urgente (menos de 2 días)',
  },
  amarillo: {
    card: 'bg-amber-500/15 border-amber-500/30 text-amber-700',
    dot: 'bg-amber-500',
    label: 'Atención (2 a 5 días)',
  },
  verde: {
    card: 'bg-green-500/15 border-green-500/30 text-green-700',
    dot: 'bg-green-500',
    label: 'Planificado (más de 5 días)',
  },
}

function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null

  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    const d = new Date(Number(year), Number(month) - 1, Number(day))
    if (!isNaN(d.getTime())) return dateToLocalKey(d)
  }

  const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy
    const d = new Date(Number(year), Number(month) - 1, Number(day))
    if (!isNaN(d.getTime())) return dateToLocalKey(d)
  }

  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return null
  return dateToLocalKey(d)
}

export default function CalendarioSolicitudesClient({ modo = 'empleado' }: { modo?: 'admin' | 'empleado' }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [solicitudes, setSolicitudes] = useState<SolicitudCalendario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<{ apiError: string | null; totalRaw: number; withFechaEntrega: number; sample: any[] } | null>(null)

  const mesActual = currentDate.getMonth()
  const yearActual = currentDate.getFullYear()
  const primerDia = new Date(yearActual, mesActual, 1).getDay()
  const diasEnMes = new Date(yearActual, mesActual + 1, 0).getDate()
  const diasPrevios = Array.isArray(primerDia) ? 0 : primerDia

  useEffect(() => {
    loadSolicitudes()
  }, [])

  async function loadSolicitudes() {
    setLoading(true)
    setError(null)
    let data: any[] = []
    try {
      const res = await fetch(`/api/solicitudes?empleado=${modo === 'empleado' ? 'true' : 'false'}`)
      if (res.ok) {
        const result = await res.json()
        data = result?.data || []
      } else {
        throw new Error(`API error ${res.status}`)
      }
    } catch (apiErr) {
      try {
        const { data: directData, error: directError } = await supabase
          .from('solicitudes')
          .select('id, paciente, prioridad, fecha_entrega, estado, progreso, odontologonombre, codigo_trazabilidad')
          .order('created_at', { ascending: false })
        if (!directError && directData) {
          data = directData as any[]
        } else {
          throw apiErr
        }
      } catch (err: any) {
        setError('No se pudieron cargar las solicitudes. Verifica permisos de visualización.')
        console.error('[calendario] Error:', err)
        setDebugInfo({
          apiError: String(apiErr),
          totalRaw: 0,
          withFechaEntrega: 0,
          sample: [],
        })
        setLoading(false)
        return
      }
    }

    const withFechaEntrega = data.filter((s: any) => s.fecha_entrega).length
    setDebugInfo({
      apiError: null,
      totalRaw: data.length,
      withFechaEntrega,
      sample: data.slice(0, 3).map((s: any) => ({
        id: s.id,
        fecha_entrega: s.fecha_entrega,
        paciente: s.paciente,
        prioridad: s.prioridad,
      })),
    })

    const parsed = data
      .filter((s: any) => s.fecha_entrega)
      .map((s: any) => {
        const fecha = normalizeDate(s.fecha_entrega)
        const dias = fecha ? getDaysRemaining(fecha) : 9999
        return {
          id: s.id,
          paciente: s.paciente || 'Sin paciente',
          prioridad: (s.prioridad || 'media') as 'alta' | 'media' | 'baja',
          fecha_entrega: fecha,
          estado: s.estado || 'pendiente',
          progreso: s.progreso || 0,
          odontologonombre: s.odontologonombre || '',
          codigo_trazabilidad: s.codigo_trazabilidad || '',
          diasRestantes: dias,
        }
      })
      .filter((s: SolicitudCalendario) => s.fecha_entrega)
    setSolicitudes(parsed)
    setLoading(false)
  }

  const solicitudesPorDia = useMemo(() => {
    const map: Record<string, SolicitudCalendario[]> = {}
    solicitudes.forEach((s) => {
      if (s.fecha_entrega) {
        if (!map[s.fecha_entrega]) map[s.fecha_entrega] = []
        map[s.fecha_entrega].push(s)
      }
    })
    return map
  }, [solicitudes])

  const days = useMemo(() => {
      const grid: { number: number; current: boolean; dateKey: string }[] = []
    for (let i = 0; i < diasPrevios; i++) {
      const prevMonth = new Date(yearActual, mesActual - 1, diasEnMes - diasPrevios + i + 1)
      grid.push({ number: prevMonth.getDate(), current: false, dateKey: dateToLocalKey(prevMonth) })
    }
    for (let i = 1; i <= diasEnMes; i++) {
      const d = new Date(yearActual, mesActual, i)
      grid.push({ number: i, current: true, dateKey: dateToLocalKey(d) })
    }
    const remaining = (7 - (grid.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const next = new Date(yearActual, mesActual + 1, i)
      grid.push({ number: i, current: false, dateKey: dateToLocalKey(next) })
    }
    return grid
  }, [yearActual, mesActual, diasEnMes, diasPrevios])

  const todayKey = useMemo(() => dateToLocalKey(new Date()), [])
  const solicitudesDelDia = selectedDate ? solicitudesPorDia[selectedDate] || [] : solicitudesPorDia[todayKey] || []

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(todayKey)
    }
  }, [todayKey])

  const handlePrevMonth = () => setCurrentDate(new Date(yearActual, mesActual - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(yearActual, mesActual + 1, 1))
  const handleToday = () => setCurrentDate(new Date())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">
          {modo === 'empleado' ? 'Calendario de entregas' : 'Calendario laboratorio'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {modo === 'empleado'
            ? 'Fechas de entrega por proximidad: rojo < 2 días, amarillo 2-5, verde > 5'
            : 'Planificación de fechas de entrega por proximidad al límite'}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>Hoy</Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="size-4" />
          </Button>
          <h2 className="text-lg font-medium">
            {MESES_ES[mesActual]} {yearActual}
          </h2>
        </div>
        <div className="flex gap-4">
          <LegendItem color={COLOR_CLASSES.rojo.dot} label={COLOR_CLASSES.rojo.label} />
          <LegendItem color={COLOR_CLASSES.amarillo.dot} label={COLOR_CLASSES.amarillo.label} />
          <LegendItem color={COLOR_CLASSES.verde.dot} label={COLOR_CLASSES.verde.label} />
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 w-full animate-pulse rounded bg-secondary" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="size-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      ) : debugInfo && debugInfo.totalRaw > 0 && solicitudes.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <p className="text-sm text-amber-600">
                Se cargaron <strong>{debugInfo.totalRaw}</strong> solicitudes, pero <strong>{debugInfo.withFechaEntrega}</strong> tienen fecha de entrega.
              </p>
              {debugInfo.sample.length > 0 && (
                <pre className="text-[10px] text-muted-foreground bg-secondary/20 p-2 rounded overflow-x-auto">
                  {JSON.stringify(debugInfo.sample, null, 2)}
                </pre>
              )}
              <p className="text-xs text-muted-foreground">
                Verifica que las fechas de entrega estén en el formato correcto.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                {DAYS_ES.map((d) => (
                  <div key={d} className="py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                   {days.map((day, i) => {
                  const daySolicitudes = solicitudesPorDia[day.dateKey] || []
                  const isToday = day.dateKey === todayKey
                  return (
                    <button
                      key={i}
                      onClick={() => day.current && setSelectedDate(day.dateKey)}
                      disabled={!day.current}
                      className={`relative h-24 cursor-pointer border border-border/30 p-1 text-left align-text-top text-xs transition-colors ${
                        !day.current ? 'bg-secondary/10 text-muted-foreground/30' :
                        day.dateKey === selectedDate ? 'bg-primary/5 border-primary' :
                        isToday ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' :
                        'hover:bg-secondary/20'
                      }`}
                    >
                      <span className={`inline-block w-5 h-5 leading-none rounded-full transition-colors ${
                        day.current ? 'text-foreground' : ''
                      } ${isToday && day.current ? 'bg-accent text-primary-foreground' : ''}`}>
                        {day.number}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {daySolicitudes.slice(0, 3).map((s) => {
                        const colorKey = getColorByProximity(s.diasRestantes)
                        const colorClass = COLOR_CLASSES[colorKey]
                        return (
                          <div
                            key={s.id}
                            className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${colorClass.card}`}
                            title={`${s.paciente} - ${s.diasRestantes < 0 ? 'Vencida' : `${s.diasRestantes} días`} - ${colorKey === 'rojo' ? 'Urgente' : colorKey === 'amarillo' ? 'Atención' : 'Planificado'}`}
                          >
                            <span className={`mr-1 inline-block size-1.5 shrink-0 rounded-full ${colorClass.dot}`}></span>
                            {s.paciente?.substring(0, 12)}
                        </div>
                      )
                    })}
                      {daySolicitudes.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">+{daySolicitudes.length - 3} más</div>
                      )}
                    </div>
                  </button>
                )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
              {selectedDate
                ? `Solicitudes de ${new Date(selectedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
                : `Solicitudes de hoy (${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })})`}
              </CardTitle>
              <CardDescription>
                {solicitudesDelDia.length} solicitud(es) para este día
              </CardDescription>
            </CardHeader>
            <CardContent>
              {solicitudesDelDia.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay solicitudes programadas para este día.</p>
              ) : (
                <div className="space-y-3">
                {solicitudesDelDia.map((s) => {
                      const colorKey = getColorByProximity(s.diasRestantes)
                      const colorClass = COLOR_CLASSES[colorKey]
                      return (
                      <div
                        key={s.id}
                        className={`border-l-4 rounded-lg border p-3 ${colorClass.card}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{s.paciente || 'Sin paciente'}</p>
                            {s.odontologonombre && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="size-3" /> {s.odontologonombre}
                              </p>
                            )}
                            {s.codigo_trazabilidad && (
                              <p className="text-xs text-muted-foreground">Código: {s.codigo_trazabilidad}</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" /> Estado: {s.estado}
                              </span>
                              <span>Progreso: {s.progreso}%</span>
                              <span className="flex items-center gap-1 font-medium">
                                <span className={`size-1.5 rounded-full ${colorClass.dot}`}></span>
                                {s.diasRestantes < 0
                                  ? 'Vencida'
                                  : s.diasRestantes === 0
                                  ? 'Entrega hoy'
                                  : `Faltan ${s.diasRestantes} día(s)`}
                              </span>
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${colorClass.card}`}>
                            {s.diasRestantes < 0 ? 'Vencida' : colorKey === 'rojo' ? 'Urgente' : colorKey === 'amarillo' ? 'Atención' : 'Planificado'}
                          </span>
                        </div>
                      </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`size-2.5 shrink-0 rounded-full ${color}`}></span>
      <span>{label}</span>
    </div>
  )
}

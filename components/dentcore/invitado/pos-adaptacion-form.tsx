'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const CHECKBOX_ITEMS = [
  { key: 'buena_adaptacion_inicial', label: 'Buena adaptación inicial' },
  { key: 'adecuada_estetica', label: 'Adecuada estética' },
  { key: 'ajuste_oclusal_adecuado', label: 'Ajuste oclusal adecuado' },
  { key: 'color_adecuado', label: 'Color adecuado' },
]

interface SolicitudLite {
  id: string
  tipo: string | null
  paciente: string | null
  odontologonombre: string | null
}

export default function PosAdaptacionForm() {
  const [email, setEmail] = useState('')
  const [paciente, setPaciente] = useState('')
  const [checks, setChecks] = useState<Record<string, boolean>>({})
  const [opinion, setOpinion] = useState('')
  const [cumpleFines, setCumpleFines] = useState('')
  const [pacienteConforme, setPacienteConforme] = useState('')
  const [nombreProfesional, setNombreProfesional] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [solicitudId, setSolicitudId] = useState('')
  const [solicitudes, setSolicitudes] = useState<SolicitudLite[]>([])
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSolicitudes() {
      const email = typeof window !== 'undefined' ? localStorage.getItem('labUserEmail') : null
      if (!email) return

      setLoadingSolicitudes(true)
      try {
        let result: SolicitudLite[] = []

        const { data: clienteData } = await supabase
          .from('cliente')
          .select('nombre')
          .eq('email', email)
          .maybeSingle()

        const nombreBuscado = clienteData?.nombre

        if (nombreBuscado) {
          const { data: odonto } = await supabase
            .from('odontologos')
            .select('id')
            .eq('nombre', nombreBuscado)
            .maybeSingle()

          if (odonto?.id) {
            const { data } = await supabase
              .from('solicitudes')
              .select('id, tipo, paciente, odontologonombre')
              .eq('odontologo_id', odonto.id)
              .order('created_at', { ascending: false })
            if (data) result = data as SolicitudLite[]
          }
        }

        if (result.length === 0 && nombreBuscado) {
          const { data } = await supabase
            .from('solicitudes')
            .select('id, tipo, paciente, odontologonombre')
            .eq('odontologonombre', nombreBuscado)
            .order('created_at', { ascending: false })
          if (data) result = data as SolicitudLite[]
        }

        setSolicitudes(result)
        if (result.length > 0 && !solicitudId) {
          setSolicitudId(result[0].id)
        }
      } catch {
        // ignore
      } finally {
        setLoadingSolicitudes(false)
      }
    }

    loadSolicitudes()
  }, [])

  const toggleCheck = (key: string) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const selectedSolicitud = solicitudes.find((s) => s.id === solicitudId)

      const { error: insertError } = await supabase.from('encuestas_pos_adaptacion').insert({
        solicitud_id: solicitudId || null,
        profesional_email: email || null,
        nombre_paciente: paciente || selectedSolicitud?.paciente || null,
        buena_adaptacion_inicial: checks.buena_adaptacion_inicial || null,
        adecuada_estetica: checks.adecuada_estetica || null,
        ajuste_oclusal_adecuado: checks.ajuste_oclusal_adecuado || null,
        color_adecuado: checks.color_adecuado || null,
        opinion_general: opinion || null,
        dispositivo_cumple_fines: cumpleFines || null,
        paciente_conforme: pacienteConforme || null,
        nombre_profesional: nombreProfesional || null,
        fecha_entrega_paciente: fechaEntrega || null,
      })

      if (insertError) {
        setError(insertError.message)
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Error al guardar la encuesta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-base">POS ADAPTACION</CardTitle>
        <CardDescription>
          Estimado(a) Doctor(a): Agradecemos nos comparta su apreciación sobre la adaptación clínica del dispositivo entregado al paciente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-primary">Email del profesional tratante</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente1@gmail.com" />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-primary">Solicitud relacionada</label>
            <select
              value={solicitudId}
              onChange={(e) => setSolicitudId(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
            >
              <option value="">Seleccionar solicitud...</option>
              {solicitudes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.tipo || 'Sin tipo'} - {s.paciente || 'Sin paciente'} {s.odontologonombre ? `(${s.odontologonombre})` : ''}
                </option>
              ))}
            </select>
            {loadingSolicitudes && <p className="text-xs text-muted-foreground">Cargando solicitudes...</p>}
            {solicitudes.length === 0 && !loadingSolicitudes && (
              <p className="text-xs text-muted-foreground">No hay solicitudes disponibles</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-primary">Nombre del Paciente</label>
            <Input value={paciente} onChange={(e) => setPaciente(e.target.value)} placeholder="Juan" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-primary">Evaluación clínica posentrega (marcar lo que corresponda):</label>
            {CHECKBOX_ITEMS.map((item) => (
              <label key={item.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!checks[item.key]}
                  onChange={() => toggleCheck(item.key)}
                  className="size-4 rounded border border-border"
                />
                {item.label}
              </label>
            ))}
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-primary">Opinión general del profesional tratante</label>
            <textarea
              className="h-24 w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              placeholder="El dispositivo cumple con los fines terapéuticos previstos..."
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-primary">El dispositivo cumple con los fines terapéuticos previstos</label>
            <textarea
              className="h-20 w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              value={cumpleFines}
              onChange={(e) => setCumpleFines(e.target.value)}
              placeholder="El dispositivo cumple con los fines terapéuticos previstos"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-primary">El paciente se encuentra conforme con el tratamiento</label>
            <textarea
              className="h-20 w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              value={pacienteConforme}
              onChange={(e) => setPacienteConforme(e.target.value)}
              placeholder="El paciente se encuentra conforme con el tratamiento"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-primary">Registrar Nombre del profesional</label>
            <Input value={nombreProfesional} onChange={(e) => setNombreProfesional(e.target.value)} placeholder="Nombre del profesional" />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-primary">Registrar Fecha de entrega al paciente</label>
            <Input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">Encuesta enviada correctamente</p>}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Encuesta'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

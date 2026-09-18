'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const TIPOS = [
  { value: 'queja', label: 'QUEJA' },
  { value: 'reclamo', label: 'RECLAMO' },
  { value: 'sugerencia', label: 'SUGERENCIA' },
  { value: 'felicitacion', label: 'FELICITACIÓN' },
] as const

interface SolicitudLite {
  id: string
  tipo: string | null
  paciente: string | null
  odontologonombre: string | null
}

export default function BuzonQuejasForm() {
  const [tipo, setTipo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [notificacionEmail, setNotificacionEmail] = useState(false)
  const [notificacionWhatsapp, setNotificacionWhatsapp] = useState(false)
  const [notificacionPresencial, setNotificacionPresencial] = useState(false)
  const [nombreApellido, setNombreApellido] = useState('')
  const [correo, setCorreo] = useState('')
  const [comentarios, setComentarios] = useState('')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const { error: insertError } = await supabase.from('buzon_quejas').insert({
        solicitud_id: solicitudId || null,
        tipo: tipo || null,
        descripcion: descripcion || null,
        notificacion_email: notificacionEmail,
        notificacion_whatsapp: notificacionWhatsapp,
        notificacion_presencial: notificacionPresencial,
        nombre_apellido: nombreApellido || null,
        correo_electronico: correo || null,
        comentarios_adicionales: comentarios || null,
        estado: 'pendiente',
      })

      if (insertError) {
        setError(insertError.message)
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Error al guardar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-base">BUZON DE QUEJAS, RECLAMOS, SUGERENCIAS Y FELICITACIONES</CardTitle>
        <CardDescription>
          Con el fin de mejorar la calidad en nuestra atención, este formato le permitirá manifestar sus sugerencias, felicitaciones o cualquier tipo de quejas y/o reclamos que tenga hacia los servicios prestados por el Laboratorio dental.
          <br />
          <span className="font-medium">La información suministrada en este formato es estrictamente confidencial y sólo será utilizada con el propósito de implementar acciones de mejora continua y permanente en la fabricación de los DMSMB.</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-primary">Email *</label>
            <Input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="cliente1@gmail.com" required />
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
            <label className="text-sm font-medium text-primary">SEÑALE EL TIPO DE SOLICITUD QUE VA A REALIZAR *</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
              required
            >
              <option value="">Seleccionar...</option>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-primary">DESCRIBA SU QUEJA, RECLAMO, SUGERENCIA O FELICITACIONES *</label>
            <textarea
              className="h-32 w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describa su solicitud ..."
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-primary">COMO DESEA SER NOTIFICADO</label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notificacionEmail}
                onChange={(e) => setNotificacionEmail(e.target.checked)}
                className="size-4 rounded border border-border"
              />
              Correo electrónico
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notificacionWhatsapp}
                onChange={(e) => setNotificacionWhatsapp(e.target.checked)}
                className="size-4 rounded border border-border"
              />
              Vía whatsapp
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notificacionPresencial}
                onChange={(e) => setNotificacionPresencial(e.target.checked)}
                className="size-4 rounded border border-border"
              />
              Presencial
            </label>
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-primary">NOMBRE Y APELLIDO</label>
            <Input value={nombreApellido} onChange={(e) => setNombreApellido(e.target.value)} placeholder="Juan" />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-primary">CORREO ELECTRONICO</label>
            <Input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="cliente1@gmail.com" />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-primary">COMENTARIOS ADICIONALES</label>
            <textarea
              className="h-24 w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Comentarios adicionales ..."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">Solicitud enviada correctamente</p>}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

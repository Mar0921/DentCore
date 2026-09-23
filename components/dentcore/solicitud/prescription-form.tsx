'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Send, FileDown, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { SolicitudSection } from '@/components/dentcore/solicitud/solicitud-section'
import {
  SolicitudEntry,
  createDefaultSolicitud,
  generateCodigoTrazabilidad,
  formatFecha,
} from '@/components/dentcore/solicitud/solicitud-types'

export function PrescriptionForm({ 
  redirectPath = '/laboratorio/solicitudes',
  odontologoPrecargado,
}: { 
  redirectPath?: string
  odontologoPrecargado?: { nombre: string; email?: string; telefono?: string }
}) {
  const router = useRouter()
  const [solicitudes, setSolicitudes] = useState<SolicitudEntry[]>([createDefaultSolicitud()])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [solicitudEnviada, setSolicitudEnviada] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('dentcore_solicitudes')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const restored = parsed.map((s) => {
            const fd = s.formData ?? {}
            return {
              ...s,
              selectedTeeth: Array.isArray(s.selectedTeeth) ? s.selectedTeeth : [],
              toothStatuses: typeof s.toothStatuses === 'object' && s.toothStatuses !== null ? s.toothStatuses : {},
              uploadedFiles: Array.isArray(s.uploadedFiles) ? s.uploadedFiles : [],
              formData: {
                ...fd,
                productos: Array.isArray(fd?.productos) ? fd.productos : [],
                piezasEnviadas: Array.isArray(fd?.piezasEnviadas) ? fd.piezasEnviadas : [],
                archivosAdjuntos: Array.isArray(fd?.archivosAdjuntos) ? fd.archivosAdjuntos : [],
              },
            }
          })
          setSolicitudes(restored)
          setActiveIndex(0)
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  useEffect(() => {
    setSolicitudes((prev) =>
      prev.map((s) => {
        if (!s.formData.fechaElaboracion.dia || !s.formData.fechaElaboracion.mes || !s.formData.fechaElaboracion.anio) {
          const now = new Date()
          s.formData.fechaElaboracion = {
            dia: String(now.getDate()),
            mes: String(now.getMonth() + 1),
            anio: String(now.getFullYear()),
          }
        }
        if (!s.formData.codigoTrazabilidad) {
          s.formData.codigoTrazabilidad = generateCodigoTrazabilidad()
        }
        if (!s.id) {
          s.id = `sol-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        }
        return s
      }),
    )
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dentcore_solicitudes', JSON.stringify(solicitudes))
      } catch {
        // ignore
      }
    }
  }, [solicitudes])

  const updateSolicitud = useCallback((index: number, updates: Partial<SolicitudEntry>) => {
    setSolicitudes((prev) => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)))
  }, [])

  const updateFormData = useCallback(
    (index: number, updates: Partial<SolicitudEntry['formData']>) => {
      setSolicitudes((prev) =>
        prev.map((s, i) => (i === index ? { ...s, formData: { ...s.formData, ...updates } } : s)),
      )
    },
    [],
  )

  const addSolicitud = () => {
    const nueva = createDefaultSolicitud()
    setSolicitudes((prev) => [...prev, nueva])
    setActiveIndex(solicitudes.length)
  }

  const removeSolicitud = (index: number) => {
    if (solicitudes.length <= 1) return
    const next = solicitudes.filter((_, i) => i !== index)
    setSolicitudes(next)
    setActiveIndex((prev) => {
      if (prev >= index && prev > 0) return prev - 1
      if (prev >= next.length) return Math.max(0, next.length - 1)
      return prev
    })
  }

  const validate = (): string | null => {
    for (let i = 0; i < solicitudes.length; i++) {
      const s = solicitudes[i]
      if (!s.servicioTipo) return `La solicitud #${i + 1} requiere seleccionar el tipo de servicio.`
      if (!s.formData.fechaEntrega.dia || !s.formData.fechaEntrega.mes || !s.formData.fechaEntrega.anio) {
        return `La solicitud #${i + 1} requiere la fecha de entrega.`
      }
    }
    return null
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    const error = validate()
    if (error) {
      alert(error)
      return
    }
    setIsSubmitting(true)
    try {
      const { data: labs } = await supabase.from('laboratorio').select('id').limit(1)
      const laboratorio_id = labs && labs.length > 0 ? labs[0].id : null
      for (const s of solicitudes) {
        const { formData, servicioTipo } = s
        let odontologo_id = null
        if (formData.odontologo) {
          const { data: odontoData, error: odontoError } = await supabase
            .from('odontologos')
            .select('id')
            .or(`nombre.eq.${formData.odontologo},clinica.eq.${formData.odontologo},email.eq.${formData.odontologo}`)
            .single()
          if (!odontoError && odontoData?.id) {
            odontologo_id = odontoData.id
          }
        }
        const productos_str = formData.productos.length > 0
          ? formData.productos.map(p => `${p.producto} x${p.unidades} (${p.dientes || 'sin dientes'}) a $${p.precioUnitario.toFixed(2)}`).join('; ')
          : ''
        const dientes_str = s.selectedTeeth.length > 0 ? s.selectedTeeth.join(', ') : ''
        const archivos_array = s.uploadedFiles.length > 0 ? s.uploadedFiles.map((f) => `${f.name}|${f.url || ''}`) : []
        const res = await fetch('/api/solicitudes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            laboratorio_id,
            odontologo_id,
            odontologonombre: formData.odontologo || null,
            odontologo_email: formData.correo || null,
            odontologo_telefono: formData.telefono || null,
            paciente: formData.paciente || null,
            cc_paciente: formData.ccPaciente || null,
            fecha_entrega: formatFecha(formData.fechaEntrega) || null,
            firma_odontologo: formData.firma || null,
            tipo: servicioTipo || formData.servicio || 'TEST',
            estado: 'pendiente',
            prioridad: 'media',
            progreso: 0,
            asignado_a: null,
            dientes: dientes_str || null,
            registro_medico: formData.registroMedico || null,
            historia_clinica: formData.historiaClinica || null,
            indicaciones: formData.indicaciones || null,
            color: formData.color || null,
            guia: formData.guia || null,
            codigo_trazabilidad: formData.codigoTrazabilidad || null,
            productos: productos_str || null,
            piezas_enviadas: formData.piezasEnviadas.length > 0 ? formData.piezasEnviadas.join(', ') : null,
            archivos: archivos_array.length > 0 ? archivos_array : null,
          }),
        })
        const result = await res.json()
        if (!res.ok) {
          throw new Error(result.error || 'Error al enviar solicitud')
        }
      }
      setIsSubmitting(false)
      setSolicitudEnviada(true)
      localStorage.removeItem('dentcore_solicitudes')
    } catch (e) {
      setIsSubmitting(false)
      alert('Error al enviar: ' + (e as any).message)
    }
  }

  const handleSaveDraft = () => {
    alert('Borrador guardado correctamente.')
  }

  const handleReset = () => {
    setSolicitudes([createDefaultSolicitud()])
    setActiveIndex(0)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card shadow-sm">
      <div className="solicitudes-tabs flex items-center gap-2 border-b border-border p-3 flex-wrap">
        {solicitudes.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${activeIndex === i ? 'bg-primary text-primary-foreground' : 'bg-background border border-border hover:bg-secondary'}`}
          >
            Solicitud {i + 1}
            {solicitudes.length > 1 && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  removeSolicitud(i)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    removeSolicitud(i)
                  }
                }}
                className="ml-1 rounded p-0.5 hover:bg-black/10"
                aria-label={`Eliminar solicitud ${i + 1}`}
              >
                <Trash2 size={12} />
              </span>
            )}
          </button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={addSolicitud}
          aria-label="Agregar solicitud"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {solicitudes.map((solicitud, index) => (
        <div key={solicitud.id} className={index !== activeIndex ? 'solicitud-section-hidden hidden' : ''}>
          <div className="p-4 sm:p-6">
            <SolicitudSection
              solicitud={solicitud}
              index={index}
              idPrefix={`sol-${solicitud.id}`}
              onUpdate={(updates) => updateSolicitud(index, updates)}
              onFormDataChange={(updates) => updateFormData(index, updates)}
              odontologoPrecargado={odontologoPrecargado}
            />
          </div>
        </div>
      ))}

      <div className="bg-primary/10 p-3">
        <div className="flex flex-col items-center gap-1 text-center text-xs text-muted-foreground">
          <p>Los precios que se presentan son de valor unitario.</p>
          <p>El valor calculado corresponde a una estimación preliminar y está sujeto a cambios tras la revisión de la solicitud.</p>
          <p className="mt-2 border-t border-border/50 pt-2 text-[10px]">
            La prescripción del dispositivo médico sobre medida bucal vence en seis (6) meses. Una vez transcurrido este tiempo,
            y al no haber concluido el trabajo, es necesario una nueva valoración del paciente y con fundamento a lo cual se
            determinará iniciar nuevamente el proceso de fabricación.
          </p>
        </div>
      </div>

      <div className="action-buttons flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={handleReset}
        >
          Limpiar formulario
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={handleSaveDraft}
          >
            Guardar borrador
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handlePrint}
          >
            <Printer className="mr-2 size-4" />
            Imprimir
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Send className="mr-2 size-4" />
            {isSubmitting ? 'Enviando...' : solicitudes.length > 1 ? `Enviar ${solicitudes.length} solicitudes` : 'Enviar solicitud'}
          </Button>
        </div>
      </div>

      {solicitudEnviada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-2xl bg-card p-6 shadow-2xl max-w-sm w-full mx-4 border border-border">
            <h3 className="text-lg font-bold text-primary">
              {solicitudes.length > 1 ? 'Solicitudes enviadas' : 'Solicitud enviada'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {solicitudes.length > 1
                ? `Se registraron ${solicitudes.length} solicitudes correctamente. Te contactaremos pronto.`
                : 'Te contactaremos pronto.'}
            </p>
            <Button
              className="mt-4 w-full"
              onClick={() => {
                setSolicitudEnviada(false)
                router.push(redirectPath)
              }}
            >
              Aceptar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

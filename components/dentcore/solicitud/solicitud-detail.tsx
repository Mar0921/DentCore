'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SolicitudDetailProps {
  solicitud: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ESTADO_VARIANT: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  en_progreso: 'bg-blue-100 text-blue-800',
  completada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
  entregada: 'bg-purple-100 text-purple-800',
}

const PRIORIDAD_VARIANT: Record<string, string> = {
  baja: 'bg-gray-100 text-gray-800',
  media: 'bg-amber-100 text-amber-800',
  alta: 'bg-orange-100 text-orange-800',
  urgente: 'bg-red-100 text-red-800',
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2 py-2 border-b border-border last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground break-words">{value || '—'}</span>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        className,
      )}
    >
      {children}
    </span>
  )
}

function formatDate(value?: string) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

export function SolicitudDetailContent({ solicitud }: { solicitud: any }) {
  if (!solicitud) return null

  const estado = solicitud.estado
  const prioridad = solicitud.prioridad

  return (
    <div className="grid gap-1 py-2">
      <DetailRow label="Estado" value={<Badge className={ESTADO_VARIANT[estado] || 'bg-gray-100 text-gray-800'}>{estado || 'sin estado'}</Badge>} />
      <DetailRow label="Prioridad" value={<Badge className={PRIORIDAD_VARIANT[prioridad] || 'bg-gray-100 text-gray-800'}>{prioridad || 'sin prioridad'}</Badge>} />
      <DetailRow label="Odontólogo / Clínica" value={solicitud.odontologonombre} />
      <DetailRow label="Paciente" value={solicitud.paciente} />
      <DetailRow label="CC. paciente" value={solicitud.cc_paciente} />
      <DetailRow label="Fecha de entrega" value={solicitud.fecha_entrega} />
      {solicitud.firma_odontologo ? (
        <DetailRow
          label="Firma del odontólogo"
          value={
            <img
              src={solicitud.firma_odontologo}
              alt="Firma del odontólogo"
              className="mt-1 max-h-20 w-full max-w-xs rounded-lg border border-border bg-white object-contain"
            />
          }
        />
      ) : null}
      <DetailRow label="Correo" value={solicitud.odonto_email || solicitud.odontologo_email} />
      <DetailRow label="Correo" value={solicitud.odonto_email || solicitud.odontologo_email} />
      <DetailRow label="Teléfono" value={solicitud.odonto_telefono || solicitud.odontologo_telefono} />
      <DetailRow label="Tipo" value={solicitud.tipo} />
      <DetailRow label="Dientes" value={solicitud.dientes} />
      <DetailRow label="Productos" value={solicitud.productos || '—'} />
      <DetailRow label="Piezas enviadas" value={solicitud.piezas_enviadas || '—'} />
      <DetailRow label="Indicaciones" value={solicitud.indicaciones || '—'} />
      <DetailRow
        label="Documentos adjuntos"
        value={
          Array.isArray(solicitud.archivos) && solicitud.archivos.length > 0
            ? solicitud.archivos.join(', ')
            : '—'
        }
      />
      <DetailRow label="Progreso" value={
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium">{solicitud.progreso ?? 0}%</span>
          <div className="h-2 w-full max-w-[100px] rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${solicitud.progreso ?? 0}%` }}
            />
          </div>
        </span>
      } />
      <DetailRow label="Asignado a" value={solicitud.asignado_a} />
      <DetailRow label="Código de trazabilidad" value={solicitud.codigo_trazabilidad} />
      <DetailRow label="Notas" value={
        solicitud.notas ? (
          <pre className="whitespace-pre-wrap text-sm">{solicitud.notas}</pre>
        ) : '—'
      } />
      <DetailRow label="Creada" value={formatDate(solicitud.created_at)} />
      <DetailRow label="Actualizada" value={formatDate(solicitud.updated_at)} />
    </div>
  )
}

export function SolicitudDetail({ solicitud, open, onOpenChange }: SolicitudDetailProps) {
  if (!solicitud) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {solicitud.codigo_trazabilidad
              ? `${solicitud.codigo_trazabilidad}${solicitud.productos ? ` · ${solicitud.productos}` : ''}`
              : `#${solicitud.id}`}
          </DialogTitle>
          <DialogDescription>
            {solicitud.tipo || 'Sin tipo'} · {formatDate(solicitud.created_at)}
          </DialogDescription>
        </DialogHeader>

        <SolicitudDetailContent solicitud={solicitud} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

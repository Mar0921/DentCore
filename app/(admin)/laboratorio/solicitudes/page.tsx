'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Eye, MoreHorizontal, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { requests as mockRequests } from '@/data/lab-mock'
import { exportPageToPDF, getPageTitle } from '@/lib/pdf-export'

interface SolicitudFromDB {
  id: string
  odontologonombre: string | null
  tipo: string | null
  estado: string | null
  prioridad: string | null
  progreso: number | null
  asignado_a: string | null
  created_at: string
  updated_at: string
  notas: string | null
}

interface RequestItem {
  id: string
  codigoTrazabilidad: string | null
  odontologistId: string
  odontologistName: string
  paciente?: string | null
  type: string
  status: string
  priority: string
  progress: number
  assignedTo?: string
  createdAt: string
  updatedAt: string
  notes?: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'En proceso', color: 'bg-primary/10 text-primary' },
  completed: { label: 'Completada', color: 'bg-accent/15 text-accent' },
  delivered: { label: 'Entregada', color: 'bg-accent/15 text-accent' },
  cancelled: { label: 'Cancelada', color: 'bg-destructive/10 text-destructive' },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baja', color: 'bg-muted text-muted-foreground' },
  medium: { label: 'Media', color: 'bg-muted text-muted-foreground' },
  high: { label: 'Alta', color: 'bg-accent/15 text-accent' },
  urgent: { label: 'Urgente', color: 'bg-destructive/10 text-destructive' },
}

function mapSolicitudToRequest(s: SolicitudFromDB): RequestItem {
  return {
    id: s.id,
    codigoTrazabilidad: (s as any).codigo_trazabilidad || null,
    odontologistId: '',
    odontologistName: s.odontologonombre || '-',
    paciente: (s as any).paciente || null,
    type: s.tipo || 'Sin tipo',
    status: s.estado || 'pending',
    priority: s.prioridad || 'medium',
    progress: s.progreso || 0,
    assignedTo: s.asignado_a || undefined,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    notes: s.notas || undefined,
  }
}

export default function SolicitudesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSolicitudes = async () => {
      try {
        const res = await fetch('/api/solicitudes')
        const result = await res.json()
        if (res.ok && result.data && result.data.length > 0) {
          setRequests(result.data.map(mapSolicitudToRequest))
        } else {
          setRequests([])
        }
      } catch {
        // Fall back to mock data only when the API is unavailable
        setRequests(
          mockRequests.map((r) => ({
            ...r,
            codigoTrazabilidad: (r as any).codigoTrazabilidad ?? null,
          }))
        )
      } finally {
        setLoading(false)
      }
    }
    fetchSolicitudes()
  }, [])

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (search) {
      const term = search.toLowerCase()
      if (
        !r.type.toLowerCase().includes(term) &&
        !r.odontologistName.toLowerCase().includes(term) &&
        !(r.paciente || '').toLowerCase().includes(term) &&
        !(r.codigoTrazabilidad || '').toLowerCase().includes(term) &&
        !r.id.toLowerCase().includes(term)
      )
        return false
    }
    return true
  })

  const handleExportSolicitudPDF = async (solicitudId: string, codigoTrazabilidad: string) => {
    try {
      // Fetch full solicitud data
      const res = await fetch(`/api/solicitudes?id=${encodeURIComponent(solicitudId)}`)
      const result = await res.json()
      const solicitud = result?.data
      
      if (!solicitud) {
        alert('No se encontró la solicitud')
        return
      }

      // Create a temporary page with the full data for printing
      await generateSolicitudPDF(solicitud, codigoTrazabilidad)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error al generar el PDF')
    }
  }

  const generateSolicitudPDF = async (solicitud: any, codigoTrazabilidad: string) => {
    // Create a printable HTML content with all solicitud data
    const printContent = createSolicitudPrintHTML(solicitud, codigoTrazabilidad)
    
    // Open new window for printing
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Permita ventanas emergentes para generar el PDF')
      return
    }
    
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        // Close window after print dialog
        setTimeout(() => printWindow.close(), 1000)
      }, 500)
    }
  }

  const createSolicitudPrintHTML = (solicitud: any, codigoTrazabilidad: string) => {
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '—'
      return new Date(dateStr).toLocaleDateString('es-ES')
    }
    
    const formatDateTime = (dateStr: string | null) => {
      if (!dateStr) return '—'
      return new Date(dateStr).toLocaleString('es-ES')
    }

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>ORDEN DE FABRICACIÓN ${codigoTrazabilidad}</title>
  <style>
    @media print {
      @page { margin: 20px; }
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
    }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      font-size: 12px; 
      line-height: 1.5; 
      color: #1f2937; 
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header { 
      border-bottom: 2px solid #3b82f6; 
      padding-bottom: 16px; 
      margin-bottom: 24px; 
    }
    .header h1 { 
      margin: 0 0 8px 0; 
      font-size: 24px; 
      color: #1e3a8a; 
    }
    .header .meta { 
      display: flex; 
      gap: 24px; 
      font-size: 11px; 
      color: #6b7280; 
    }
    .section { margin-bottom: 20px; }
    .section-title { 
      font-size: 14px; 
      font-weight: 600; 
      color: #374151; 
      border-bottom: 1px solid #e5e7eb; 
      padding-bottom: 4px; 
      margin-bottom: 12px; 
    }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .field { display: flex; flex-direction: column; gap: 2px; }
    .field-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { font-size: 12px; color: #1f2937; }
    .badge { 
      display: inline-block; 
      padding: 2px 8px; 
      border-radius: 9999px; 
      font-size: 10px; 
      font-weight: 500; 
    }
    .badge-estado-pendiente { background: #f3f4f6; color: #374151; }
    .badge-estado-en_progreso { background: #dbeafe; color: #1e40af; }
    .badge-estado-completada { background: #d1fae5; color: #065f46; }
    .badge-estado-entregada { background: #d1fae5; color: #065f46; }
    .badge-estado-cancelada { background: #fee2e2; color: #991b1b; }
    .badge-prioridad-baja { background: #f3f4f6; color: #374151; }
    .badge-prioridad-media { background: #f3f4f6; color: #374151; }
    .badge-prioridad-alta { background: #fef3c7; color: #92400e; }
    .badge-prioridad-urgente { background: #fee2e2; color: #991b1b; }
    .dental-chart { margin-top: 8px; }
    .dental-chart svg { width: 100%; max-width: 600px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    .footer { 
      margin-top: 32px; 
      padding-top: 16px; 
      border-top: 1px solid #e5e7eb; 
      font-size: 10px; 
      color: #9ca3af; 
      text-align: center; 
    }
    @page { margin: 20mm; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ORDEN DE FABRICACIÓN</h1>
    <div class="meta">
      <span><strong>Código trazabilidad:</strong> ${codigoTrazabilidad}</span>
      <span><strong>ID:</strong> ${solicitud.id}</span>
      <span><strong>Fecha creación:</strong> ${formatDateTime(solicitud.created_at)}</span>
      <span><strong>Última actualización:</strong> ${formatDateTime(solicitud.updated_at)}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Información del Paciente</div>
    <div class="grid">
      <div class="field">
        <span class="field-label">Paciente</span>
        <span class="field-value">${solicitud.paciente || '—'}</span>
      </div>
      <div class="field">
        <span class="field-label">CC. Paciente</span>
        <span class="field-value">${solicitud.cc_paciente || '—'}</span>
      </div>
      <div class="field">
        <span class="field-label">Fecha de entrega</span>
        <span class="field-value">${formatDate(solicitud.fecha_entrega)}</span>
      </div>
      <div class="field">
        <span class="field-label">Tipo de trabajo</span>
        <span class="field-value">${solicitud.tipo || '—'}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Estado y Seguimiento</div>
    <div class="grid">
      <div class="field">
        <span class="field-label">Estado</span>
        <span class="field-value">
          <span class="badge badge-estado-${solicitud.estado || 'pendiente'}">
            ${({ 
              pendiente: 'Pendiente',
              en_progreso: 'En proceso',
              completada: 'Completada',
              entregada: 'Entregada',
              cancelada: 'Cancelada'
            } as Record<string, string>)[solicitud.estado] || solicitud.estado || '—'}
          </span>
        </span>
      </div>
      <div class="field">
        <span class="field-label">Prioridad</span>
        <span class="field-value">
          <span class="badge badge-prioridad-${solicitud.prioridad || 'media'}">
            ({({ baja: 'Baja', media: 'Media', alta: 'Alta', urgente: 'Urgente' } as Record<string, string>)[solicitud.prioridad] || solicitud.prioridad || '—'})
          </span>
        </span>
      </div>
      <div class="field">
        <span class="field-label">Progreso</span>
        <span class="field-value">${solicitud.progreso || 0}%</span>
      </div>
      <div class="field">
        <span class="field-label">Asignado a</span>
        <span class="field-value">${solicitud.asignado_a || '—'}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Odontólogo / Clínica</div>
    <div class="grid">
      <div class="field">
        <span class="field-label">Nombre</span>
        <span class="field-value">${solicitud.odontologonombre || '—'}</span>
      </div>
      <div class="field">
        <span class="field-label">Email</span>
        <span class="field-value">${solicitud.odontologo_email || '—'}</span>
      </div>
      <div class="field">
        <span class="field-label">Teléfono</span>
        <span class="field-value">${solicitud.odontologo_telefono || '—'}</span>
      </div>
    </div>
  </div>

  ${solicitud.dientes ? `
  <div class="section">
    <div class="section-title">Dientes (${solicitud.dientes})</div>
    <div class="dental-chart">
      ${generateDentalChartSVG(solicitud.dientes)}
    </div>
  </div>
  ` : ''}

  ${solicitud.productos ? `
  <div class="section">
    <div class="section-title">Productos</div>
    <div class="field-value whitespace-pre-wrap">${solicitud.productos}</div>
  </div>
  ` : ''}

  ${solicitud.piezas_enviadas ? `
  <div class="section">
    <div class="section-title">Piezas Enviadas</div>
    <div class="field-value whitespace-pre-wrap">${solicitud.piezas_enviadas}</div>
  </div>
  ` : ''}

  ${solicitud.indicaciones ? `
  <div class="section">
    <div class="section-title">Indicaciones</div>
    <div class="field-value whitespace-pre-wrap">${solicitud.indicaciones}</div>
  </div>
  ` : ''}

  ${solicitud.notas ? `
  <div class="section">
    <div class="section-title">Notas</div>
    <div class="field-value whitespace-pre-wrap">${solicitud.notas}</div>
  </div>
  ` : ''}

  ${solicitud.firma_odontologo ? `
  <div class="section">
    <div class="section-title">Firma del Odontólogo</div>
    <img src="${solicitud.firma_odontologo}" alt="Firma" style="max-height: 80px; border: 1px solid #e5e7eb; border-radius: 4px;">
  </div>
  ` : ''}

  ${Array.isArray(solicitud.archivos) && solicitud.archivos.length > 0 ? `
  <div class="section">
    <div class="section-title">Documentos Adjuntos</div>
    <ul style="margin: 0; padding-left: 20px;">
      ${solicitud.archivos.map((archivo: string) => `<li>${archivo}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${solicitud.registro_medico ? `
  <div class="section">
    <div class="section-title">Registro Médico</div>
    <div class="field-value whitespace-pre-wrap">${solicitud.registro_medico}</div>
  </div>
  ` : ''}

  ${solicitud.historia_clinica ? `
  <div class="section">
    <div class="section-title">Historia Clínica</div>
    <div class="field-value whitespace-pre-wrap">${solicitud.historia_clinica}</div>
  </div>
  ` : ''}

  ${solicitud.color ? `
  <div class="section">
    <div class="section-title">Color</div>
    <div class="field-value">${solicitud.color}</div>
  </div>
  ` : ''}

  ${solicitud.guia ? `
  <div class="section">
    <div class="section-title">Guía</div>
    <div class="field-value">${solicitud.guia}</div>
  </div>
  ` : ''}

  <div class="footer">
    Documento generado automáticamente por DentCore • ${new Date().toLocaleString('es-ES')}
  </div>
</body>
</html>
    `
  }

  const generateDentalChartSVG = (dientesStr: string) => {
    const dientes = dientesStr.split(/[\s,]+/).map(d => parseInt(d, 10)).filter(n => !isNaN(n) && n >= 1 && n <= 48)
    if (dientes.length === 0) return '<p class="text-muted-foreground">Sin dientes registrados</p>'
    
    // Generate a simple SVG dental chart
    const toothPositions = {
      1: [50, 50], 2: [100, 50], 3: [150, 50], 4: [200, 50], 5: [250, 50], 6: [300, 50], 7: [350, 50], 8: [400, 50],
      9: [50, 120], 10: [100, 120], 11: [150, 120], 12: [200, 120], 13: [250, 120], 14: [300, 120], 15: [350, 120], 16: [400, 120],
      17: [50, 190], 18: [100, 190], 19: [150, 190], 20: [200, 190], 21: [250, 190], 22: [300, 190], 23: [350, 190], 24: [400, 190],
      25: [50, 260], 26: [100, 260], 27: [150, 260], 28: [200, 260], 29: [250, 260], 30: [300, 260], 31: [350, 260], 32: [400, 260],
      33: [50, 330], 34: [100, 330], 35: [150, 330], 36: [200, 330], 37: [250, 330], 38: [300, 330], 39: [350, 330], 40: [400, 330],
      41: [50, 400], 42: [100, 400], 43: [150, 400], 44: [200, 400], 45: [250, 400], 46: [300, 400], 47: [350, 400], 48: [400, 400],
    }

    const toothSize = 30
    const svgWidth = 450
    const svgHeight = 450
    
    let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">`
    
    Object.entries(toothPositions).forEach(([num, [x, y]]) => {
      const toothNum = parseInt(num)
      const isSelected = dientes.includes(toothNum)
      svg += `
        <g transform="translate(${x - toothSize/2}, ${y - toothSize/2})">
          <rect x="0" y="0" width="${toothSize}" height="${toothSize}" 
                fill="${isSelected ? '#3b82f6' : '#f3f4f6'}" 
                stroke="${isSelected ? '#1e40af' : '#d1d5db'}" 
                stroke-width="1" rx="4"/>
          <text x="${toothSize/2}" y="${toothSize/2 + 4}" 
                text-anchor="middle" font-size="10" fill="${isSelected ? 'white' : '#374151'}" font-weight="bold">
            ${toothNum}
          </text>
        </g>`
    })
    
    svg += '</svg>'
    return svg
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Solicitudes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Solicitudes activas y su estado</p>
        </div>
        <Button className="gap-2" onClick={() => router.push('/laboratorio/solicitudes/nueva')}>
          <Plus className="size-4" />
          Nueva solicitud
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Solicitudes activas</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Listado de solicitudes registradas</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar solicitud..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline" className="gap-2">
                  {statusFilter === 'all' ? 'Todas' : statusConfig[statusFilter]?.label ?? 'Estado'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>Todas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pendientes</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>En proceso</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completadas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('delivered')}>Entregadas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('cancelled')}>Canceladas</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-primary">Cargando solicitudes…</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Obteniendo el listado de solicitudes.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-primary">No hay solicitudes</p>
              <p className="mt-1 text-xs text-muted-foreground">
                No hay solicitudes que coincidan con los filtros actuales.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Código trazabilidad</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Odontólogo</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Paciente</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Prioridad</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Progreso</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((req) => {
                    const estado = statusConfig[req.status] ?? { label: req.status, color: 'bg-muted text-muted-foreground' }
                    const prioridad = priorityConfig[req.priority] ?? { label: req.priority, color: 'bg-muted text-muted-foreground' }
                    return (
                      <tr key={req.id} className="transition-colors hover:bg-secondary/30">
                        <td className="px-4 py-4">
                          {req.codigoTrazabilidad ? (
                            <span className="font-mono text-xs text-primary">{req.codigoTrazabilidad}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-foreground">{req.type}</td>
                        <td className="px-4 py-4 text-muted-foreground">{req.odontologistName}</td>
                        <td className="px-4 py-4 text-muted-foreground">{req.paciente ?? '-'}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${prioridad.color}`}>
                            {prioridad.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${estado.color}`}>
                            {estado.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-secondary">
                              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${req.progress}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{req.progress}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/laboratorio/solicitudes/${req.id}`)}>
                                <Eye className="size-4" />
                                Ver detalle
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

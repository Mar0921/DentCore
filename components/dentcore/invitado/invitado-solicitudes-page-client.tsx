'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search, FileText, Plus, Download } from 'lucide-react'
import { exportPageToPDF, getPageTitle } from '@/lib/pdf-export'

const ESTADOS_FINALIZADOS = new Set([
  'completada',
  'entregada',
  'finalizada',
  'terminada',
  'cerrada',
  'completed',
  'delivered',
  'finalizado',
  'done',
])

const tabs = [
  { key: 'activas', label: 'No finalizadas' },
  { key: 'finalizadas', label: 'Finalizadas' },
] as const

type Tab = (typeof tabs)[number]['key']

export function InvitadoSolicitudesPageClient() {
  const router = useRouter()
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('activas')

  useEffect(() => {
    loadSolicitudes()
  }, [])

  async function loadSolicitudes() {
    setLoading(true)
    try {
      const email = localStorage.getItem('labUserEmail')
      if (!email) return

      const { data: clienteData } = await supabase
        .from('cliente')
        .select('id, nombre')
        .eq('email', email)
        .maybeSingle()

      const nombreBuscado = clienteData?.nombre

      let result: any[] = []
      if (nombreBuscado) {
        const { data: odonto } = await supabase
          .from('odontologos')
          .select('id')
          .eq('nombre', nombreBuscado)
          .maybeSingle()

        if (odonto?.id) {
          const { data } = await supabase
            .from('solicitudes')
            .select('*')
            .eq('odontologo_id', odonto.id)
            .order('created_at', { ascending: false })
          if (data) result = data
        }
      }

      if (result.length === 0 && nombreBuscado) {
        const { data } = await supabase
          .from('solicitudes')
          .select('*')
          .eq('odontologonombre', nombreBuscado)
          .order('created_at', { ascending: false })
        if (data) result = data
      }

      setSolicitudes(result)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const tituloSolicitud = (s: any) =>
    s.codigo_trazabilidad
      ? `${s.codigo_trazabilidad}${s.productos ? ` · ${s.productos}` : ''}`
      : `Solicitud ${s.id}`

  const isFinalizada = (s: any) => ESTADOS_FINALIZADOS.has(String(s.estado || '').toLowerCase())

  const filtered = useMemo(() => {
    if (!search) return solicitudes
    const term = search.toLowerCase()
    return solicitudes.filter((s) => {
      return (
        tituloSolicitud(s).toLowerCase().includes(term) ||
        (s.tipo || '').toLowerCase().includes(term) ||
        (s.estado || '').toLowerCase().includes(term) ||
        String(s.id || '').toLowerCase().includes(term)
      )
    })
  }, [solicitudes, search])

  const solicitudesActivas = useMemo(() => filtered.filter((s) => !isFinalizada(s)), [filtered])
  const solicitudesFinalizadas = useMemo(() => filtered.filter((s) => isFinalizada(s)), [filtered])

  const visibleList = tab === 'finalizadas' ? solicitudesFinalizadas : solicitudesActivas

  const renderList = (list: any[]) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="mx-auto size-12 mb-2 opacity-50" />
          <p>No hay solicitudes en esta sección</p>
        </div>
      )
    }

    const handleExportSolicitudPDF = async (solicitudId: string, codigoTrazabilidad: string) => {
      try {
        const res = await fetch(`/api/solicitudes?id=${encodeURIComponent(solicitudId)}`)
        const result = await res.json()
        const solicitud = result?.data
        
        if (!solicitud) {
          alert('No se encontró la solicitud')
          return
        }

        await generateSolicitudPDF(solicitud, codigoTrazabilidad)
      } catch (error) {
        console.error('Error generating PDF:', error)
        alert('Error al generar el PDF')
      }
    }

    const generateSolicitudPDF = async (solicitud: any, codigoTrazabilidad: string) => {
      const printContent = createSolicitudPrintHTML(solicitud, codigoTrazabilidad)
      
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('Permita ventanas emergentes para generar el PDF')
        return
      }
      
      printWindow.document.write(printContent)
      printWindow.document.close()
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
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
  <title>Solicitud ${codigoTrazabilidad}</title>
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
    <h1>Detalle de Solicitud</h1>
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
            }[solicitud.estado] || solicitud.estado || '—')}
          </span>
        </span>
      </div>
      <div class="field">
        <span class="field-label">Prioridad</span>
        <span class="field-value">
          <span class="badge badge-prioridad-${solicitud.prioridad || 'media'}">
            ${({ baja: 'Baja', media: 'Media', alta: 'Alta', urgente: 'Urgente' }[solicitud.prioridad] || solicitud.prioridad || '—')}
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
      <div className="space-y-3">
        {list.map((s) => (
          <Card
            key={s.id}
            className="cursor-pointer border border-border p-4 transition-colors hover:bg-secondary/50"
            onClick={() => router.push(`/invitado-laboratorio/solicitudes/${s.id}`)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{tituloSolicitud(s)}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-primary hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExportSolicitudPDF(s.id, s.codigo_trazabilidad || s.id)
                  }}
                >
                  <Download className="size-3" />
                </Button>
              </div>
              <CardDescription>{s.tipo || 'Sin tipo'}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-xs text-muted-foreground">
                Estado: {s.estado || 'sin estado'}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(s.created_at).toLocaleDateString('es-CO')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Mis Solicitudes</h1>
          <p className="text-sm text-muted-foreground">Listado de solicitudes registradas</p>
        </div>
        <Button className="gap-2" onClick={() => router.push('/invitado-laboratorio/solicitudes/nueva')}>
          <Plus className="size-4" />
          Nueva solicitud
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar solicitud..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <nav className="flex items-center gap-0.5 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        renderList(visibleList)
      )}
    </div>
  )
}


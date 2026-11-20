// lib/generarFormatoRecepcion.ts
// Genera el PDF "RECEPCION E INSPECCION MATERIA PRIMA LABORATORIO DENTAL + <laboratorio>"
// Requiere: npm i jspdf jspdf-autotable

export const CODIGO_FORMATO = 'SIG-GC-FOR-006'

function parseFecha(value?: string | null): Date | null {
  if (!value) return null
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

// día-mes-año (15-03-2025)
function fmtDMY(value?: string | null): string {
  const d = parseFecha(value)
  if (!d) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}-${mm}-${d.getFullYear()}`
}

// Lote cuando no hay lote del fabricante: díamesaño sin ceros (15/3/2025 -> 1532025)
function loteDesdeFecha(value?: string | null): string {
  const d = parseFecha(value)
  return d ? `${d.getDate()}${d.getMonth() + 1}${d.getFullYear()}` : '—'
}

function diasParaVencer(value?: string | null): number | null {
  const d = parseFecha(value)
  if (!d) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - hoy.getTime()) / 86400000)
}

function normalizarAceptacion(estado?: string | null): string {
  const e = (estado || '').toString().trim().toUpperCase()
  if (e === 'ACEPTADO' || e === 'APROBADO') return 'APROBADO'
  if (e === 'RECHAZADO' || e === 'RECHAZO') return 'RECHAZO'
  if (e === 'DEVOLUCION' || e === 'DEVOLUCIÓN') return 'DEVOLUCION'
  if (e === 'CUARENTENA') return 'CUARENTENA'
  return '—'
}

const txt = (v: any) => (v === null || v === undefined || String(v).trim() === '' ? '—' : String(v))
const siNo = (v: any) => (v === true || v === 'true' ? 'SÍ' : 'NO')

export async function descargarFormatoRecepcion(m: any, laboratorioNombre: string) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const lab = (laboratorioNombre || '').trim()
  const tituloBase = 'RECEPCION E INSPECCION MATERIA PRIMA LABORATORIO DENTAL'
  const titulo = lab ? `${tituloBase} ${lab.toUpperCase()}` : tituloBase

  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const margin = 12
  const anchoUtil = doc.internal.pageSize.getWidth() - margin * 2

  // ---------- Encabezado ----------
  autoTable(doc, {
    startY: margin,
    margin: { left: margin, right: margin },
    theme: 'grid',
    body: [[
      { content: titulo, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 11 } },
      { content: `CÓDIGO:\n${CODIGO_FORMATO}`, styles: { halign: 'center', valign: 'middle', fontStyle: 'bold', fontSize: 10 } },
    ]],
    columnStyles: { 0: { cellWidth: anchoUtil - 50 }, 1: { cellWidth: 50 } },
    styles: { lineColor: [60, 60, 60], lineWidth: 0.3, textColor: 20, cellPadding: 4 },
  })

  // ---------- Datos ----------
  const fechaIngreso = m.fecha_ingreso || m.created_at
  const dias = diasParaVencer(m.fecha_vencimiento)
  const loteRecepcion = m.numero_lote || m.lote_fabricante || loteDesdeFecha(fechaIngreso)

  const label = (principal: string, nota?: string) => ({
    content: nota ? `${principal}\n${nota}` : principal,
    styles: { fontStyle: 'bold' as const, fillColor: [238, 238, 238] as [number, number, number] },
  })
  const link = (url?: string | null) => {
    if (!url) return { content: '—' }
    const first = String(url).split(',')[0].trim()
    return { content: 'Ver documento (enlace)', url: first, styles: { textColor: [0, 70, 200] as [number, number, number] } } as any
  }

  const filas: any[][] = [
    [label('CÓDIGO INTERNO'), txt(m.codigo_interno)],
    [label('CANTIDAD DE ENTRADA'), m.cantidad_entrada !== null && m.cantidad_entrada !== undefined && m.cantidad_entrada !== ''
      ? `${m.cantidad_entrada} ${m.unidad_medida || ''}`.trim() : '—'],
    [label('NOMBRE DE MATERIA PRIMA, COMPONENTE O INSUMO'), txt(m.nombre_materia_prima || m.nombre)],
    [label('FECHA DE INGRESO AL LABORATORIO', 'día-mes-año · aplica método FIFO'),
      `${fmtDMY(fechaIngreso)}     FIFO: ${siNo(m.aplica_fifo)}`],
    [label('CÓDIGO DE REFERENCIA', '(si aplica)'), txt(m.ref_fabricante)],
    [label('MARCA'), txt(m.marca_fabricante)],
    [label('PROVEEDOR'), txt(m.proveedor)],
    [label('DOMICILIO'), txt(m.domicilio_proveedor)],
    [label('REGISTRO INVIMA O REG. SANITARIO', 'si aplica · verifique si está vigente'),
      `${txt(m.registro_invima)}     VIGENTE: ${siNo(m.invima_vigente)}`],
    [label('LOTE DEL FABRICANTE'), txt(m.lote_fabricante)],
    [label('LOTE', 'sin lote de fabricante: día mes año de la recepción (ej. 1532025)'), loteRecepcion],
    [label('FECHA DE VENCIMIENTO', 'si aplica · día-mes-año'), fmtDMY(m.fecha_vencimiento)],
    [label('FECHA DE APERTURA', 'día-mes-año'), fmtDMY(m.fecha_apertura)],
    [label('FECHA DE CIERRE', 'día-mes-año'), fmtDMY(m.fecha_cierre)],
    [label('DÍAS FALTANTES PARA VENCIMIENTO', 'aplicar método FEFO'),
      `${dias === null ? '—' : dias}     FEFO: ${siNo(m.aplica_fefo)}`],
    [label('FORMA DE ALMACENAMIENTO'), txt(m.forma_almacenamiento)],
    [label('CONDICIONES FÍSICAS'), txt(m.condiciones_fisicas)],
    [label('ESTADO DE ACEPTACIÓN'), { content: normalizarAceptacion(m.estado_aceptacion), styles: { fontStyle: 'bold' } }],
    [label('RESPONSABLE DE INSPECCIÓN'), txt(m.responsable_inspeccion)],
    [label('RESPONSABLE DE RECEPCIÓN'), txt(m.responsable_recepcion)],
    [label('DOCUMENTOS DE RECEPCIÓN'), link(m.documentos_recepcion)],
    [label('FICHA DE SEGURIDAD'), link(m.ficha_seguridad_url)],
    [label('FICHA TÉCNICA'), link(m.ficha_tecnica_url)],
  ]

  autoTable(doc, {
    startY: ((doc as any).lastAutoTable?.finalY ?? margin) + 4,
    margin: { left: margin, right: margin },
    theme: 'grid',
    body: filas,
    columnStyles: { 0: { cellWidth: 78 }, 1: { cellWidth: anchoUtil - 78 } },
    styles: { fontSize: 9, cellPadding: 2.5, lineColor: [60, 60, 60], lineWidth: 0.2, textColor: 20, valign: 'middle' },
    didDrawCell: (data: any) => {
      const url = data.cell?.raw?.url
      if (data.section === 'body' && data.column.index === 1 && url) {
        doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url })
      }
    },
  })

  // ---------- Pie ----------
  const total = doc.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text(`${CODIGO_FORMATO}  ·  Material: ${txt(m.codigo)}  ·  Página ${i} de ${total}`, margin, doc.internal.pageSize.getHeight() - 8)
  }

  const nombreArchivo = `${titulo} - ${txt(m.codigo)}`.replace(/[\\/:*?"<>|]/g, '').trim()
  doc.save(`${nombreArchivo}.pdf`)
}
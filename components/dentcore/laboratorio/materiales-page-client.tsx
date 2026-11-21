'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Edit2, Save, X, Trash2, ChevronDown, ChevronRight, Download } from 'lucide-react'
import { descargarFormatoRecepcion } from '@/lib/generarFormatoRecepcion'

const categorias = ['Acrilicos','Encerados','Implantologia','Impresion en resina LCD','Libre de metal','Metal','Uclas/Anillos en cromo','Yesos','Otros']
const tipos = ['Resina','Metal','Zirconio','Disilicato','Cera','Yeso','Otros']
const estadosAceptacion = ['APROBADO', 'DEVOLUCION', 'RECHAZO', 'CUARENTENA']
const estadosGenerales = ['pendiente', 'recibido', 'en_uso', 'agotado', 'vencido', 'desechado', 'cuarentena']

const emptyForm = {
  codigo: '', nombre: '', numero_lote: '', categoria: '', tipo_material: '',
  marca_fabricante: '', ref_fabricante: '', material: '', producto: '', proveedor: '',
}

/* ---------- Helpers ---------- */

// Convierte valores antiguos (aceptado, rechazado, pendiente...) a las nuevas opciones
function normalizarAceptacion(estado?: string | null): string {
  const e = (estado || '').toString().trim().toUpperCase()
  if (e === 'ACEPTADO' || e === 'APROBADO') return 'APROBADO'
  if (e === 'RECHAZADO' || e === 'RECHAZO') return 'RECHAZO'
  if (e === 'DEVOLUCION' || e === 'DEVOLUCIÓN') return 'DEVOLUCION'
  if (e === 'CUARENTENA') return 'CUARENTENA'
  return ''
}

const getEstadoAceptacionClass = (estado: string) => {
  switch (estado) {
    case 'APROBADO': return 'bg-green-100 text-green-800'
    case 'RECHAZO': return 'bg-red-100 text-red-800'
    case 'DEVOLUCION': return 'bg-orange-100 text-orange-800'
    case 'CUARENTENA': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getEstadoGeneralClass = (estado: string) => {
  switch (estado) {
    case 'recibido': return 'bg-blue-100 text-blue-800'
    case 'en_uso': return 'bg-purple-100 text-purple-800'
    case 'agotado': return 'bg-gray-100 text-gray-800'
    case 'vencido': return 'bg-red-100 text-red-800'
    case 'desechado': return 'bg-black text-white'
    case 'cuarentena': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Interpreta 'YYYY-MM-DD' como fecha local (evita desfase por zona horaria)
function parseFecha(value?: string | null): Date | null {
  if (!value) return null
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function formatFecha(value?: string | null): string {
  const d = parseFecha(value)
  return d ? d.toLocaleDateString('es-CO') : '—'
}

function diasParaVencer(value?: string | null): number | null {
  const d = parseFecha(value)
  if (!d) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - hoy.getTime()) / 86400000)
}

/**
 * Semáforo de vencimiento:
 *  - 365 días o más (1 año en adelante)  -> VERDE
 *  - 90 a 364 días                       -> AMARILLO
 *  - 0 a 89 días                         -> ROJO (PRONTO VENCIMIENTO)
 *  - menos de 0                          -> ROJO oscuro (VENCIDO)
 */
function semaforoVencimiento(dias: number | null) {
  if (dias === null) return { label: 'Sin fecha', cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }
  if (dias < 0) return { label: 'VENCIDO', cls: 'bg-red-200 text-red-900', dot: 'bg-red-700' }
  if (dias <= 89) return { label: 'PRONTO VENCIMIENTO', cls: 'bg-red-100 text-red-800', dot: 'bg-red-500' }
  if (dias <= 364) return { label: 'AMARILLO', cls: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' }
  return { label: 'VERDE', cls: 'bg-green-100 text-green-800', dot: 'bg-green-500' }
}

function textoSemaforo(dias: number | null) {
  const s = semaforoVencimiento(dias)
  if (dias === null) return s.label
  if (dias < 0) return `Vencido hace ${Math.abs(dias)} d`
  if (s.label === 'PRONTO VENCIMIENTO') return `Pronto venc. · ${dias} d`
  return `${dias} d`
}

/* ---------- Campos del detalle / edición (agrupados) ---------- */

type Field = { key: string; label: string; type: 'text' | 'number' | 'date' | 'checkbox' | 'select'; step?: string; options?: string[]; readOnly?: boolean }

const secciones: { titulo: string; campos: Field[] }[] = [
  {
    titulo: 'Identificación',
    campos: [
      { key: 'codigo_interno', label: 'Cód. interno', type: 'text' },
      { key: 'nombre_materia_prima', label: 'Nombre materia prima', type: 'text' },
      { key: 'ref_fabricante', label: 'Cód. referencia', type: 'text' },
      { key: 'marca_fabricante', label: 'Marca', type: 'text' },
      { key: 'unidad_medida', label: 'Unidad de medida', type: 'text' },
      { key: 'cantidad_entrada', label: 'Cant. entrada', type: 'number', step: '0.001' },
    ],
  },
  {
    titulo: 'Lotes y proveedor',
    campos: [
      { key: 'lote_fabricante', label: 'Lote fabricante', type: 'text' },
      { key: 'numero_lote', label: 'Lote recepción', type: 'text' },
      { key: 'domicilio_proveedor', label: 'Domicilio proveedor', type: 'text' },
      { key: 'registro_invima', label: 'Registro INVIMA', type: 'text' },
      { key: 'invima_vigente', label: 'INVIMA vigente', type: 'checkbox' },
      { key: 'aplica_fifo', label: 'Aplica FIFO', type: 'checkbox' },
      { key: 'aplica_fefo', label: 'Aplica FEFO', type: 'checkbox' },
    ],
  },
  {
    titulo: 'Fechas',
    campos: [
      { key: 'fecha_ingreso', label: 'Fecha ingreso', type: 'date' },
      { key: 'fecha_vencimiento', label: 'Fecha vencimiento', type: 'date' },
      { key: 'dias_faltantes_vencimiento', label: 'Días faltantes (auto)', type: 'number', readOnly: true },
      { key: 'fecha_apertura', label: 'Fecha apertura', type: 'date' },
      { key: 'fecha_cierre', label: 'Fecha cierre', type: 'date' },
    ],
  },
  {
    titulo: 'Almacenamiento y estados',
    campos: [
      { key: 'forma_almacenamiento', label: 'Forma de almacenamiento', type: 'text' },
      { key: 'condiciones_fisicas', label: 'Condiciones físicas', type: 'text' },
      { key: 'ubicacion_almacen', label: 'Ubicación', type: 'text' },
      { key: 'estado_aceptacion', label: 'Estado de aceptación', type: 'select', options: estadosAceptacion },
      { key: 'estado_general', label: 'Estado general', type: 'select', options: estadosGenerales },
    ],
  },
  {
    titulo: 'Responsables y documentos',
    campos: [
      { key: 'responsable_inspeccion', label: 'Resp. inspección', type: 'text' },
      { key: 'responsable_recepcion', label: 'Resp. recepción', type: 'text' },
      { key: 'documentos_recepcion', label: 'Docs. recepción (URL)', type: 'text' },
      { key: 'ficha_seguridad_url', label: 'Ficha de seguridad (URL)', type: 'text' },
      { key: 'ficha_tecnica_url', label: 'Ficha técnica (URL)', type: 'text' },
      { key: 'observaciones', label: 'Observaciones', type: 'text' },
    ],
  },
]

const COLS = 10

export function MaterialesPageClient({ empleado }: { empleado?: boolean }) {
  const [laboratorioId, setLaboratorioId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [materiales, setMateriales] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [laboratorioNombre, setLaboratorioNombre] = useState('')

  useEffect(() => {
    const savedLabId = localStorage.getItem('labId')
    if (savedLabId) {
      setLaboratorioId(savedLabId)
    } else {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          supabase.from('empleados').select('laboratorio_id').eq('email', user.email).maybeSingle()
            .then(({ data }) => {
              if (data?.laboratorio_id) {
                setLaboratorioId(data.laboratorio_id)
                localStorage.setItem('labId', data.laboratorio_id)
              } else {
                supabase.from('laboratorio').select('id').limit(1).then(({ data }) => {
                  if (data && data.length > 0) setLaboratorioId(data[0].id)
                })
              }
            })
        }
      })
    }
  }, [])

  useEffect(() => {
    if (laboratorioId) loadMateriales()
  }, [laboratorioId])

  // Nombre del laboratorio para el título del formato (ajusta 'nombre' si tu columna se llama distinto)
  useEffect(() => {
    if (!laboratorioId) return
    supabase.from('laboratorio').select('nombre').eq('id', laboratorioId).maybeSingle()
      .then(({ data }) => setLaboratorioNombre(data?.nombre ?? ''))
  }, [laboratorioId])

  async function descargarFormato(m: any) {
    try {
      await descargarFormatoRecepcion(m, laboratorioNombre)
    } catch (err: any) {
      console.error(err)
      alert('No se pudo generar el documento: ' + err.message)
    }
  }

  async function loadMateriales() {
    setLoading(true)
    try {
      const res = await fetch(`/api/materiales?laboratorio_id=${laboratorioId}`)
      if (res.ok) {
        const result = await res.json()
        setMateriales(result.data || [])
      } else {
        console.error('API error:', await res.json())
      }
    } catch (e) {
      console.error('Error loading materiales:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!laboratorioId) return
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('laboratorio_id', laboratorioId)
      Object.entries(form).forEach(([key, value]) => formData.append(key, String(value ?? '')))
      if (file) formData.append('archivo', file)

      const res = await fetch('/api/materiales', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al guardar')
      }
      const result = await res.json()
      setMateriales([result.data, ...materiales])
      setForm(emptyForm)
      setFile(null)
    } catch (err: any) {
      console.error(err)
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function toggleExpand(id: string) {
    if (editingId === id) return
    setExpandedId(expandedId === id ? null : id)
  }

  function startEdit(m: any) {
    setExpandedId(m.id)
    setEditingId(m.id)
    setEditForm({
      ...m,
      estado_aceptacion: normalizarAceptacion(m.estado_aceptacion) || 'CUARENTENA',
      fecha_ingreso: m.fecha_ingreso?.slice(0, 10) ?? '',
      fecha_vencimiento: m.fecha_vencimiento?.slice(0, 10) ?? '',
      fecha_apertura: m.fecha_apertura?.slice(0, 10) ?? '',
      fecha_cierre: m.fecha_cierre?.slice(0, 10) ?? '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  function updateEditField(key: string, value: any) {
    setEditForm((prev: any) => {
      const next = { ...prev, [key]: value }
      if (key === 'fecha_vencimiento') {
        next.dias_faltantes_vencimiento = diasParaVencer(value)
      }
      return next
    })
  }

  async function saveEdit(m: any) {
    try {
      const payload = { ...editForm }
      // Los días faltantes siempre se calculan desde la fecha de vencimiento
      payload.dias_faltantes_vencimiento = diasParaVencer(payload.fecha_vencimiento)
      // Fechas vacías -> null para que la BD no rechace ''
      ;['fecha_ingreso', 'fecha_vencimiento', 'fecha_apertura', 'fecha_cierre'].forEach((k) => {
        if (!payload[k]) payload[k] = null
      })

      const res = await fetch('/api/materiales', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: m.id, ...payload }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      const result = await res.json()
      setMateriales(materiales.map((mat) => (mat.id === m.id ? result.data : mat)))
      cancelEdit()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function deleteMaterial(id: string) {
    if (!confirm('¿Eliminar este material?')) return
    try {
      const res = await fetch('/api/materiales?id=' + id, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      setMateriales(materiales.filter((m) => m.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  /* ---------- Render de campos ---------- */

  function renderEditField(field: Field) {
    const raw = editForm[field.key]
    const val = raw ?? ''
    const base = 'w-full border rounded px-2 py-1 text-sm bg-background'

    if (field.type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={val === true || val === 'true'}
          onChange={(e) => updateEditField(field.key, e.target.checked)}
          className="rounded border-border size-4"
        />
      )
    }
    if (field.type === 'select') {
      return (
        <select value={val} onChange={(e) => updateEditField(field.key, e.target.value)} className={base}>
          {field.key === 'estado_general' && !val && <option value="">—</option>}
          {field.options!.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )
    }
    return (
      <input
        type={field.type}
        step={field.step}
        value={val}
        readOnly={field.readOnly}
        onChange={(e) => updateEditField(field.key, e.target.value)}
        className={base + (field.readOnly ? ' bg-muted text-muted-foreground' : '')}
      />
    )
  }

  function renderViewField(field: Field, m: any) {
    const raw = m[field.key]
    if (field.type === 'checkbox') return raw ? '✓ Sí' : '—'
    if (field.type === 'date') return formatFecha(raw)
    if (field.key === 'dias_faltantes_vencimiento') {
      const d = diasParaVencer(m.fecha_vencimiento)
      return d === null ? '—' : String(d)
    }
    if (field.key === 'estado_aceptacion') {
      const e = normalizarAceptacion(raw) || 'PENDIENTE'
      return <span className={`px-2 py-0.5 rounded text-xs ${getEstadoAceptacionClass(e)}`}>{e}</span>
    }
    if (field.key === 'estado_general') {
      const e = raw || 'pendiente'
      return <span className={`px-2 py-0.5 rounded text-xs ${getEstadoGeneralClass(e)}`}>{e}</span>
    }
    if (['documentos_recepcion', 'ficha_seguridad_url', 'ficha_tecnica_url'].includes(field.key)) {
      if (!raw) return '—'
      const href = String(raw).split(',')[0].trim()
      return <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">Ver</a>
    }
    return raw !== null && raw !== undefined && raw !== '' ? String(raw) : '—'
  }

  /* ---------- UI ---------- */

  return (
    <div className="space-y-6 max-w-full px-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Materiales</h1>
        <p className="text-sm text-muted-foreground">Gestión de materiales del laboratorio</p>
      </div>

      {/* Formulario Nuevo Material */}
      {!empleado && (
      <Card>
        <CardHeader><CardTitle>Nuevo Material</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><span className="text-sm font-medium">CÓDIGO</span><Input placeholder="Ej: MAT-001" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required /></div>
              <div><span className="text-sm font-medium">NOMBRE</span><Input placeholder="Nombre del material" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required /></div>
              <div><span className="text-sm font-medium">NÚMERO DE LOTE</span><Input placeholder="Ej: LOTE-001" value={form.numero_lote} onChange={(e) => setForm({ ...form, numero_lote: e.target.value })} /></div>
              <div>
                <span className="text-sm font-medium">Categoría</span>
                <select className="w-full border rounded px-3 py-2" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                  <option value="">Selecciona categoría</option>
                  {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <span className="text-sm font-medium">Tipo de material</span>
                <select className="w-full border rounded px-3 py-2" value={form.tipo_material} onChange={(e) => setForm({ ...form, tipo_material: e.target.value })}>
                  <option value="">Selecciona tipo</option>
                  {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><span className="text-sm font-medium">Marca/Fabricante</span><Input placeholder="Marca o fabricante" value={form.marca_fabricante} onChange={(e) => setForm({ ...form, marca_fabricante: e.target.value })} /></div>
              <div><span className="text-sm font-medium">Ref. Fabricante</span><Input placeholder="Referencia del fabricante" value={form.ref_fabricante} onChange={(e) => setForm({ ...form, ref_fabricante: e.target.value })} /></div>
              <div><span className="text-sm font-medium">Material</span><Input placeholder="Material" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} /></div>
              <div><span className="text-sm font-medium">Producto</span><Input placeholder="Producto" value={form.producto} onChange={(e) => setForm({ ...form, producto: e.target.value })} /></div>
              <div><span className="text-sm font-medium">Proveedor</span><Input placeholder="Proveedor" value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} /></div>
            </div>
            <div>
              <span className="text-sm font-medium">Archivo</span>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => { setForm(emptyForm); setFile(null) }}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Material'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Materiales registrados */}
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Materiales Registrados</CardTitle>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Vencimiento:</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-green-500" />Verde: 1 año en adelante (365+ días)</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-yellow-500" />Amarillo: 364 a 90 días</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-red-500" />Rojo · Pronto vencimiento: 89 a 0 días</span>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <th className="p-2 w-8" />
                <th className="p-2 text-left">Código</th>
                <th className="p-2 text-left">Material</th>
                <th className="p-2 text-left">Lote</th>
                <th className="p-2 text-left">Categoría / Tipo</th>
                <th className="p-2 text-left">Proveedor / Marca</th>
                <th className="p-2 text-left">Vencimiento</th>
                <th className="p-2 text-left">Est. aceptación</th>
                <th className="p-2 text-left">Est. general</th>
                <th className="p-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materiales.map((m) => {
                const isOpen = expandedId === m.id
                const isEditing = editingId === m.id
                const dias = diasParaVencer(m.fecha_vencimiento)
                const sem = semaforoVencimiento(dias)
                const aceptacion = normalizarAceptacion(m.estado_aceptacion) || 'PENDIENTE'
                const estadoGeneral = m.estado_general || 'pendiente'
                const archivos: { label: string; url: string }[] = [
                  m.archivo_url && { label: 'Archivo', url: m.archivo_url },
                  m.ficha_tecnica_url && { label: 'Ficha técnica', url: m.ficha_tecnica_url },
                  m.ficha_seguridad_url && { label: 'Ficha seguridad', url: m.ficha_seguridad_url },
                  m.documentos_recepcion && { label: 'Docs. recepción', url: String(m.documentos_recepcion).split(',')[0].trim() },
                ].filter(Boolean) as any

                return (
                  <React.Fragment key={m.id}>
                    <tr className={`border-b hover:bg-muted/30 ${isOpen ? 'bg-muted/20' : ''}`}>
                      <td className="p-2">
                        <Button variant="ghost" size="icon" onClick={() => toggleExpand(m.id)} title={isOpen ? 'Ocultar detalle' : 'Ver detalle'}>
                          {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </Button>
                      </td>
                      <td className="p-2 font-mono text-xs">{m.codigo}</td>
                      <td className="p-2">
                        <div className="font-medium">{m.nombre || '—'}</div>
                        {m.nombre_materia_prima && <div className="text-xs text-muted-foreground">{m.nombre_materia_prima}</div>}
                      </td>
                      <td className="p-2 text-xs">{m.numero_lote || '—'}</td>
                      <td className="p-2 text-xs">
                        <div>{m.categoria || '—'}</div>
                        <div className="text-muted-foreground">{m.tipo_material || '—'}</div>
                      </td>
                      <td className="p-2 text-xs">
                        <div>{m.proveedor || '—'}</div>
                        <div className="text-muted-foreground">{m.marca_fabricante || '—'}</div>
                      </td>
                      <td className="p-2">
                        <div className="text-xs">{formatFecha(m.fecha_vencimiento)}</div>
                        <span className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded text-xs ${sem.cls}`}>
                          <span className={`size-2 rounded-full ${sem.dot}`} />
                          {textoSemaforo(dias)}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${getEstadoAceptacionClass(aceptacion)}`}>{aceptacion}</span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${getEstadoGeneralClass(estadoGeneral)}`}>{estadoGeneral}</span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1 justify-end">
                          {!isEditing && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => descargarFormato(m)} title="Descargar formato SIG-GC-FOR-006"><Download className="size-4" /></Button>
                              {!empleado && (
                                <>
                                  <Button variant="ghost" size="icon" onClick={() => startEdit(m)} title="Editar"><Edit2 className="size-4" /></Button>
                                  <Button variant="ghost" size="icon" onClick={() => deleteMaterial(m.id)} title="Eliminar"><Trash2 className="size-4" /></Button>
                                </>
                              )}
                            </>
                          )}
                          {isEditing && !empleado && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => saveEdit(m)} title="Guardar"><Save className="size-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={cancelEdit} title="Cancelar"><X className="size-4" /></Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="border-b bg-secondary/40">
                        <td colSpan={COLS} className="p-4">
                          <div className="space-y-5">
                            {secciones.map((sec) => (
                              <div key={sec.titulo}>
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{sec.titulo}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-3">
                                  {sec.campos.map((f) => (
                                    <div key={f.key} className="flex flex-col gap-1">
                                      <label className="text-[11px] text-muted-foreground">{f.label}</label>
                                      {isEditing
                                        ? renderEditField(f)
                                        : <div className="text-sm break-words">{renderViewField(f, m)}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}

                            {!isEditing && archivos.length > 0 && (
                              <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Archivos</h3>
                                <div className="flex flex-wrap gap-3 text-sm">
                                  {archivos.map((a) => (
                                    <a key={a.label} href={a.url} target="_blank" rel="noreferrer" className="text-primary underline">{a.label}</a>
                                  ))}
                                </div>
                              </div>
                            )}

                            {isEditing && (
                              <div className="flex gap-2 pt-1">
                                <Button variant="outline" onClick={cancelEdit}>Cancelar</Button>
                                <Button onClick={() => saveEdit(m)}>Guardar cambios</Button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>

          {loading && <div className="text-center py-8 text-muted-foreground">Cargando materiales...</div>}
          {materiales.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">No hay materiales registrados</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
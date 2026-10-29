'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'

interface Incidencia {
  id: string
  codigo?: string
  solicitud_id: string
  solicitud_codigo_trazabilidad?: string | null
  tipo: string
  fecha: string
  hora: string
  fase?: string | null
  descripcion: string
  responsable?: string | null
  estado: string
}

interface SolicitudLite {
  id: string
  codigo_trazabilidad: string | null
  paciente: string | null
  odontologonombre: string | null
  tipo: string | null
  productos?: string | null
  notas?: string | null
}

interface Medida {
  id: string
  incidencia_id: string
  estado: string
  fecha_resolucion: string | null
  responsable: string | null
  medidas_tomadas: string
  created_at: string
}

interface FaseLite {
  id: string
  nombre: string
  orden: number
}

function formatProductos(productos?: string | null) {
  if (!productos) return null
  const lines = productos.split(/\n|;/).map((l) => l.trim()).filter(Boolean)
  const idx = lines.findIndex((l) => l.toLowerCase().includes('acrilico'))
  if (idx >= 0) {
    return lines.slice(0, idx + 1).join('\n')
  }
  return productos
}

// Normaliza para comparar nombres: sin tildes, sin espacios extra, minúsculas
function normalize(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

// "DISILICATOS x3 (11,12,13) a $200000.00; METAL  x1 (34) a $150000.00" -> ["DISILICATOS", "METAL"]
function parseNombresProductos(productos?: string | null): string[] {
  const nombres = (productos || '')
    .split(/\n|;/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = p.match(/^(.*?)\s+x\d+\s*\(/i)
      return (m ? m[1] : p).trim()
    })
    .filter(Boolean)
  return Array.from(new Set(nombres))
}

export default function IncidenciasPage() {
  const router = useRouter()
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [solicitudes, setSolicitudes] = useState<SolicitudLite[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({ solicitud_id: '', tipo: '', fecha: '', hora: '', fase: '', responsable: '', descripcion: '' })
  const [editForm, setEditForm] = useState<Incidencia | null>(null)
  const [tab, setTab] = useState<'basicos' | 'productos' | 'medidas'>('basicos')
  const [medidas, setMedidas] = useState<Medida[]>([])
  const [medidaForm, setMedidaForm] = useState({ estado: 'nueva', fecha_resolucion: '', responsable: '', medidas_tomadas: '' })
  const [fasesDisponibles, setFasesDisponibles] = useState<FaseLite[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
    loadEmpleados()
  }, [])

  // Solicitud con la que se está trabajando en el diálogo abierto (nueva o edición)
  const solicitudActivaId = editOpen ? editForm?.solicitud_id || '' : open ? form.solicitud_id : ''

  // Fases disponibles: solo las de los productos de la solicitud (productos -> producto_fases -> fases)
  useEffect(() => {
    const sol = solicitudes.find((s) => s.id === solicitudActivaId)
    const nombres = parseNombresProductos(sol?.productos)
    if (!sol || nombres.length === 0) {
      setFasesDisponibles([])
      return
    }

    let cancelled = false

    async function load() {
      try {
        const { data: productos, error: errProd } = await supabase.from('productos').select('id, titulo, nombre')
        if (errProd) throw errProd

        const encontrados: any[] = []
        for (const n of nombres.map(normalize)) {
          const prod = (productos || []).find(
            (p: any) => normalize(p.titulo) === n || (normalize(p.nombre) !== '' && normalize(p.nombre) === n),
          )
          if (prod && !encontrados.some((e) => e.id === prod.id)) encontrados.push(prod)
        }
        if (encontrados.length === 0) {
          if (!cancelled) setFasesDisponibles([])
          return
        }

        const { data: relaciones, error: errRel } = await supabase
          .from('producto_fases')
          .select('producto_id, fase_id, orden')
          .in('producto_id', encontrados.map((p) => p.id))
          .order('orden', { ascending: true })
        if (errRel) throw errRel

        const faseIds = Array.from(new Set((relaciones || []).map((r: any) => r.fase_id)))
        let fasesData: any[] = []
        if (faseIds.length > 0) {
          const { data, error: errFases } = await supabase.from('fases').select('id, nombre').in('id', faseIds)
          if (errFases) throw errFases
          fasesData = data || []
        }
        const nombrePorFase = new Map<string, string>(
          fasesData.map((f: any) => [f.id, f.nombre] as [string, string]),
        )

        // Sin repetir fases compartidas entre productos
        const vistos = new Set<string>()
        const lista: FaseLite[] = []
        for (const prod of encontrados) {
          for (const r of (relaciones || []).filter((x: any) => x.producto_id === prod.id)) {
            if (vistos.has(r.fase_id)) continue
            vistos.add(r.fase_id)
            const nombre = nombrePorFase.get(r.fase_id)
            if (nombre) lista.push({ id: r.fase_id, nombre, orden: r.orden })
          }
        }
        if (!cancelled) setFasesDisponibles(lista)
      } catch (e) {
        console.error('Error cargando fases de los productos:', e)
        if (!cancelled) setFasesDisponibles([])
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [solicitudActivaId, solicitudes])

  async function loadEmpleados() {
    try {
      const { data } = await supabase.from('empleados').select('id, nombre').order('nombre')
      if (data) setEmpleados(data)
    } catch {}
  }

  async function fetchData() {
    setLoading(true)
    try {
      const [incRes, solRes] = await Promise.all([fetch('/api/incidencias'), fetch('/api/solicitudes')])
      const incJson = await incRes.json()
      const solJson = await solRes.json()
      if (incJson.data) setIncidencias(incJson.data)
      if (solJson.data) setSolicitudes(solJson.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function loadMedidas(incidenciaId: string) {
    try {
      const res = await fetch('/api/incidencia-medidas?incidencia_id=' + encodeURIComponent(incidenciaId))
      const json = await res.json()
      if (json.data) setMedidas(json.data)
      else setMedidas([])
    } catch {
      setMedidas([])
    }
  }

  function openNew() {
    setForm({ solicitud_id: '', tipo: '', fecha: '', hora: '', fase: '', responsable: '', descripcion: '' })
    setOpen(true)
  }

  function openEdit(inc: Incidencia) {
    setEditForm({ ...inc })
    setTab('basicos')
    setMedidas([])
    setMedidaForm({ estado: inc.estado === 'cerrada' ? 'cerrada' : inc.estado === 'en_proceso' ? 'en_proceso' : inc.estado === 'abierta' ? 'abierta' : 'nueva', fecha_resolucion: '', responsable: '', medidas_tomadas: '' })
    loadMedidas(inc.id)
    setEditOpen(true)
  }

  async function handleSave() {
    if (!form.solicitud_id || !form.tipo || !form.fecha || !form.hora || !form.descripcion) {
      alert('Complete todos los campos obligatorios')
      return
    }
    setSaving(true)
    try {
      const solicitud = solicitudes.find((s) => s.id === form.solicitud_id)
      const res = await fetch('/api/incidencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitud_id: form.solicitud_id,
          solicitud_codigo_trazabilidad: solicitud?.codigo_trazabilidad || null,
          tipo: form.tipo,
          fecha: form.fecha,
          hora: form.hora,
          fase: form.fase || null,
          responsable: form.responsable || null,
          descripcion: form.descripcion,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al guardar')
      setOpen(false)
      fetchData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate() {
    if (!editForm) return
    setSaving(true)
    try {
      const res = await fetch('/api/incidencias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editForm.id,
          tipo: editForm.tipo,
          fecha: editForm.fecha,
          hora: editForm.hora,
          fase: editForm.fase || null,
          responsable: editForm.responsable || null,
          descripcion: editForm.descripcion,
          estado: editForm.estado,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al actualizar')
      setEditOpen(false)
      fetchData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddMedida() {
    if (!editForm) return
    if (!medidaForm.medidas_tomadas) {
      alert('Ingrese las medidas tomadas')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/incidencia-medidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidencia_id: editForm.id,
          estado: medidaForm.estado,
          fecha_resolucion: medidaForm.fecha_resolucion || null,
          responsable: medidaForm.responsable || null,
          medidas_tomadas: medidaForm.medidas_tomadas,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al guardar')
      // update incidencia estado
      await fetch('/api/incidencias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editForm.id, estado: medidaForm.estado }),
      })
      setMedidaForm({ estado: medidaForm.estado, fecha_resolucion: '', responsable: '', medidas_tomadas: '' })
      setEditForm((f) => (f ? { ...f, estado: medidaForm.estado } : f))
      setIncidencias((prev) => prev.map((inc) => (inc.id === editForm.id ? { ...inc, estado: medidaForm.estado } : inc)))
      loadMedidas(editForm.id)
      fetchData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta incidencia?')) return
    try {
      const res = await fetch('/api/incidencias?id=' + encodeURIComponent(id), { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al eliminar')
      fetchData()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const filtered = incidencias.filter((i) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      (i.codigo || '').toLowerCase().includes(term) ||
      i.tipo.toLowerCase().includes(term) ||
      (i.solicitud_codigo_trazabilidad || '').toLowerCase().includes(term) ||
      (i.responsable || '').toLowerCase().includes(term) ||
      i.descripcion.toLowerCase().includes(term)
    )
  })

  const solicitudEdit = editForm ? solicitudes.find((s) => s.id === editForm.solicitud_id) : null

  // Opciones del desplegable de fase (solo las de los productos de la solicitud)
  function renderFaseOptions(current?: string | null) {
    const extra = current && !fasesDisponibles.some((f) => f.nombre === current) ? current : null
    return (
      <>
        <option value="">Seleccionar fase...</option>
        {extra && <option value={extra}>{extra}</option>}
        {fasesDisponibles.map((fa) => (
          <option key={fa.id} value={fa.nombre}>{fa.nombre}</option>
        ))}
        {fasesDisponibles.length === 0 && !extra && (
          <option value="" disabled>
            {solicitudActivaId ? 'No hay fases asociadas a los productos de la solicitud' : 'Seleccione primero una solicitud'}
          </option>
        )}
      </>
    )
  }

  // Opciones del desplegable de responsable (empleados)
  function renderResponsableOptions(current?: string | null) {
    const extra = current && !empleados.some((e) => e.nombre === current) ? current : null
    return (
      <>
        <option value="">Seleccionar responsable...</option>
        {extra && <option value={extra}>{extra}</option>}
        {empleados.map((e) => (
          <option key={e.id} value={e.nombre}>{e.nombre}</option>
        ))}
      </>
    )
  }

  const SELECT_CLASS = 'h-10 w-full rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/30'

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Incidencias</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestión de incidencias relacionadas a solicitudes</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="size-4" />Nueva Incidencia</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Listado de incidencias</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Solicitud</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha / Hora</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fase</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registrado por</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">Cargando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">No hay incidencias registradas</td></tr>
                ) : (
                  filtered.map((inc) => (
                    <tr key={inc.id} className="hover:bg-secondary/20">
                      <td className="px-4 py-3 font-mono text-xs">{inc.codigo || '-'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => router.push('/laboratorio/solicitudes/' + inc.solicitud_id)} className="text-primary hover:underline">
                          {inc.solicitud_codigo_trazabilidad || inc.solicitud_id.slice(0, 8)}
                        </button>
                      </td>
                      <td className="px-4 py-3">{inc.tipo}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{inc.fecha} {(inc.hora || '').slice(0, 5)}</td>
                      <td className="px-4 py-3">{inc.fase || '-'}</td>
                      <td className="px-4 py-3">{inc.responsable || '-'}</td>
                      <td className="px-4 py-3 capitalize">{inc.estado}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{inc.descripcion}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => router.push('/laboratorio/solicitudes/' + inc.solicitud_id)} title="Ver solicitud"><Eye className="size-4" /></Button>
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(inc)} title="Editar"><Pencil className="size-4" /></Button>
                          <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDelete(inc.id)} title="Borrar"><Trash2 className="size-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva Incidencia</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-primary">Solicitud relacionada *</label>
              <select
                value={form.solicitud_id}
                onChange={(e) => setForm((f) => ({ ...f, solicitud_id: e.target.value, fase: '' }))}
                className={SELECT_CLASS}
              >
                <option value="">Seleccionar solicitud...</option>
                {solicitudes.map((s) => (<option key={s.id} value={s.id}>{s.codigo_trazabilidad || s.id.slice(0, 8)} - {s.paciente || s.odontologonombre || s.tipo || ''}</option>))}
              </select>
            </div>
            <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Tipo *</label><Input placeholder="Ej. Retraso, Calidad" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Fecha *</label><Input type="date" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} /></div>
              <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Hora *</label><Input type="time" value={form.hora} onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))} /></div>
            </div>
            <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Fase</label>
              <select value={form.fase} onChange={(e) => setForm((f) => ({ ...f, fase: e.target.value }))} className={SELECT_CLASS}>
                {renderFaseOptions(form.fase)}
              </select>
            </div>
            <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Registrado por</label>
              <select value={form.responsable} onChange={(e) => setForm((f) => ({ ...f, responsable: e.target.value }))} className={SELECT_CLASS}>
                {renderResponsableOptions(form.responsable)}
              </select>
            </div>
            <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Descripción *</label><Textarea placeholder="Descripción de la incidencia" value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} rows={4} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>Editar Incidencia</DialogTitle></DialogHeader>
          {editForm && (
            <>
              <div className="flex gap-2 border-b border-border mb-4">
                <button onClick={() => setTab('basicos')} className={'px-4 py-2 text-sm ' + (tab === 'basicos' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>Datos básicos</button>
                <button onClick={() => setTab('productos')} className={'px-4 py-2 text-sm ' + (tab === 'productos' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>Productos</button>
                <button onClick={() => setTab('medidas')} className={'px-4 py-2 text-sm ' + (tab === 'medidas' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>Medidas</button>
              </div>
              {tab === 'basicos' && (
                <div className="grid gap-4">
                  <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Código</label><Input value={editForm.codigo || ''} disabled /></div>
                  <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Tipo</label><Input value={editForm.tipo} onChange={(e) => setEditForm((f) => f ? { ...f, tipo: e.target.value } : f)} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Fecha</label><Input type="date" value={editForm.fecha} onChange={(e) => setEditForm((f) => f ? { ...f, fecha: e.target.value } : f)} /></div>
                    <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Hora</label><Input type="time" value={editForm.hora} onChange={(e) => setEditForm((f) => f ? { ...f, hora: e.target.value } : f)} /></div>
                  </div>
                  <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Fase</label>
                    <select value={editForm.fase || ''} onChange={(e) => setEditForm((f) => f ? { ...f, fase: e.target.value } : f)} className={SELECT_CLASS}>
                      {renderFaseOptions(editForm.fase)}
                    </select>
                  </div>
                  <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Registrado por</label>
                    <select value={editForm.responsable || ''} onChange={(e) => setEditForm((f) => f ? { ...f, responsable: e.target.value } : f)} className={SELECT_CLASS}>
                      {renderResponsableOptions(editForm.responsable)}
                    </select>
                  </div>
                  <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Estado</label>
                    <select value={editForm.estado} onChange={(e) => setEditForm((f) => f ? { ...f, estado: e.target.value } : f)} className={SELECT_CLASS}>
                      <option value="nueva">nueva</option>
                      <option value="abierta">abierta</option>
                      <option value="en_proceso">en_proceso</option>
                      <option value="cerrada">cerrada</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Descripción</label><Textarea value={editForm.descripcion} onChange={(e) => setEditForm((f) => f ? { ...f, descripcion: e.target.value } : f)} rows={4} /></div>
                </div>
              )}
              {tab === 'productos' && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Productos asociados a la solicitud: {solicitudEdit?.codigo_trazabilidad || editForm.solicitud_id}</p>
                  {solicitudEdit?.productos ? (
                    <div className="rounded-lg border border-border p-3 text-sm whitespace-pre-wrap">{formatProductos(solicitudEdit.productos)}</div>
                  ) : (
                    <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Sin información de productos disponible.</div>
                  )}
                  {solicitudEdit?.notas && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Notas de la solicitud</p>
                      <div className="rounded-lg border border-border p-3 text-sm whitespace-pre-wrap">{solicitudEdit.notas}</div>
                    </div>
                  )}
                </div>
              )}
              {tab === 'medidas' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border bg-secondary/30"><th className="px-3 py-2 text-left font-medium text-muted-foreground">Estado</th><th className="px-3 py-2 text-left font-medium text-muted-foreground">Fecha resolución</th><th className="px-3 py-2 text-left font-medium text-muted-foreground">Responsable</th><th className="px-3 py-2 text-left font-medium text-muted-foreground">Medidas tomadas</th></tr></thead>
                      <tbody className="divide-y divide-border">
                        {medidas.length === 0 ? <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">Sin registros</td></tr> : medidas.map((m) => (<tr key={m.id}><td className="px-3 py-2 capitalize">{m.estado}</td><td className="px-3 py-2">{m.fecha_resolucion || '-'}</td><td className="px-3 py-2">{m.responsable || '-'}</td><td className="px-3 py-2">{m.medidas_tomadas}</td></tr>))}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid gap-3 rounded-lg border border-border p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Estado</label>
                        <select value={medidaForm.estado} onChange={(e) => setMedidaForm((f) => ({ ...f, estado: e.target.value }))} className={SELECT_CLASS}>
                          <option value="nueva">nueva</option><option value="abierta">abierta</option><option value="en_proceso">en_proceso</option><option value="cerrada">cerrada</option>
                        </select>
                      </div>
                      <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Fecha resolución</label><Input type="date" value={medidaForm.fecha_resolucion} onChange={(e) => setMedidaForm((f) => ({ ...f, fecha_resolucion: e.target.value }))} /></div>
                    </div>
                    <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Responsable</label>
                      <select value={medidaForm.responsable} onChange={(e) => setMedidaForm((f) => ({ ...f, responsable: e.target.value }))} className={SELECT_CLASS}>
                        <option value="">Seleccionar responsable</option>
                        {empleados.map((e) => (<option key={e.id} value={e.nombre}>{e.nombre}</option>))}
                      </select>
                    </div>
                    <div className="grid gap-1.5"><label className="text-sm font-medium text-primary">Medidas tomadas</label><Textarea value={medidaForm.medidas_tomadas} onChange={(e) => setMedidaForm((f) => ({ ...f, medidas_tomadas: e.target.value }))} rows={3} /></div>
                    <div className="flex justify-end"><Button onClick={handleAddMedida} disabled={saving}>{saving ? 'Guardando...' : 'Agregar'}</Button></div>
                  </div>
                </div>
              )}
            </>
          )}
          <DialogFooter>
            {tab === 'basicos' ? (<><Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button onClick={handleUpdate} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button></>) : (<Button variant="outline" onClick={() => setEditOpen(false)}>Cerrar</Button>)}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
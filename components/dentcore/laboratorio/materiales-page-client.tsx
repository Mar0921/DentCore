'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const categorias = ['Acrilicos','Encerados','Implantologia','Impresion en resina LCD','Libre de metal','Metal','Uclas/Anillos en cromo','Yesos','Otros']
const tipos = ['Resina','Metal','Zirconio','Disilicato','Cera','Yeso','Otros']

export function MaterialesPageClient() {
  const [laboratorioId, setLaboratorioId] = useState<string | null>(null)
  const [form, setForm] = useState({
    codigo: '', nombre: '', numero_lote: '', categoria: '', tipo_material: '',
    marca_fabricante: '', ref_fabricante: '', material: '', producto: '', proveedor: '',
  })
  const [materiales, setMateriales] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('laboratorio').select('id').limit(1)
      if (data && data.length > 0) setLaboratorioId(data[0].id)
    })()
  }, [])

  useEffect(() => {
    if (laboratorioId) {
      (async () => {
        const { data } = await supabase.from('materiales').select('*').eq('laboratorio_id', laboratorioId).order('created_at', { ascending: false })
        if (data) setMateriales(data)
      })()
    }
  }, [laboratorioId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      let archivo_url: string | null = null
      if (file) {
        const ext = file.name.split('.').pop() || ''
        const storagePath = `public/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`
        const { error: upErr } = await supabase.storage.from('solicitudes-documentos').upload(storagePath, file)
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('solicitudes-documentos').getPublicUrl(storagePath)
          archivo_url = publicUrl
        }
      }
      await supabase.from('materiales').insert({ ...form, archivo_url, laboratorio_id: laboratorioId })
      const { data } = await supabase.from('materiales').select('*').eq('laboratorio_id', laboratorioId).order('created_at', { ascending: false })
      if (data) setMateriales(data)
      setForm({ codigo: '', nombre: '', numero_lote: '', categoria: '', tipo_material: '', marca_fabricante: '', ref_fabricante: '', material: '', producto: '', proveedor: '' })
      setFile(null)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Nuevo Material</h1>
        <p className="text-sm text-muted-foreground">Completa los datos y sube el archivo del material</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Nuevo Material</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-sm font-medium">CODIGO</span><Input placeholder="Ej: MAT-001" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} /></div>
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
              <span className="text-sm font-medium">Archivo del material</span>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => { setForm({ codigo: '', nombre: '', numero_lote: '', categoria: '', tipo_material: '', marca_fabricante: '', ref_fabricante: '', material: '', producto: '', proveedor: '' }); setFile(null) }}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Material'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Materiales</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">CÓDIGO</th>
                  <th className="p-2 text-left">NÚMERO DE LOTE</th>
                  <th className="p-2 text-left">NOMBRE</th>
                  <th className="p-2 text-left">Categoría</th>
                  <th className="p-2 text-left">Tipo de material</th>
                  <th className="p-2 text-left">Marca / Fabricante</th>
                  <th className="p-2 text-left">Ref. Fabricante</th>
                  <th className="p-2 text-left">Material</th>
                  <th className="p-2 text-left">Producto</th>
                  <th className="p-2 text-left">Archivo</th>
                  <th className="p-2 text-left">Acciones</th>
                  <th className="p-2 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {materiales.map((m) => (
                  <tr key={m.id} className="border-b">
                    <td className="p-2">{m.codigo}</td>
                    <td className="p-2">{m.numero_lote}</td>
                    <td className="p-2">{m.nombre}</td>
                    <td className="p-2">{m.categoria}</td>
                    <td className="p-2">{m.tipo_material}</td>
                    <td className="p-2">{m.marca_fabricante}</td>
                    <td className="p-2">{m.ref_fabricante}</td>
                    <td className="p-2">{m.material}</td>
                    <td className="p-2">{m.producto}</td>
                    <td className="p-2">{m.archivo_url ? <a href={m.archivo_url} target="_blank" rel="noreferrer" className="text-primary underline">Ver</a> : '—'}</td>
                    <td className="p-2">—</td>
                    <td className="p-2">{m.created_at ? new Date(m.created_at).toLocaleDateString('es-CO') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


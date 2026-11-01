'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit, Trash2, PenTool, RotateCcw } from 'lucide-react'

const ROLES_REQUERIDOS = [
  'Representante legal',
  'Director tecnico',
  'Asistente técnico',
]
export function FirmasPageClient() {
  const [firmas, setFirmas] = useState<any[]>([])
  const [laboratorioId, setLaboratorioId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    titulo: '',
    rol: '',
    firma_data_url: '',
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasDirty, setCanvasDirty] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    loadLaboratorio()
  }, [])

  useEffect(() => {
    if (laboratorioId) {
      loadFirmas()
    }
  }, [laboratorioId])

  async function loadLaboratorio() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      const { data } = await supabase.from('laboratorio').select('id').eq('email', user.email).limit(1)
      if (data && data.length > 0) {
        setLaboratorioId(data[0].id)
        return
      }
      const { data: emp } = await supabase.from('empleados').select('laboratorio_id').eq('email', user.email).limit(1)
      if (emp && emp.length > 0 && emp[0].laboratorio_id) {
        setLaboratorioId(emp[0].laboratorio_id)
        return
      }
    }
    const { data } = await supabase.from('laboratorio').select('id').limit(1)
    if (data && data.length > 0) setLaboratorioId(data[0].id)
  }

  async function loadFirmas() {
    if (!laboratorioId) return
    const { data } = await supabase
      .from('firmas')
      .select('*')
      .eq('laboratorio_id', laboratorioId)
      .order('created_at', { ascending: false })
    if (data) setFirmas(data)
  }

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const scale = canvas.width / rect.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2 * scale
    ctx.strokeStyle = '#000000'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  useEffect(() => {
    if (open && canvasRef.current) {
      initCanvas()
      if (editing?.firma_data_url) {
        const img = new Image()
        img.onload = () => {
          const ctx = canvasRef.current?.getContext('2d')
          if (ctx && canvasRef.current) {
            ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height)
          }
        }
        img.src = editing.firma_data_url
      }
    }
  }, [open, editing, initCanvas])

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    setIsDrawing(true)
    setCanvasDirty(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    ctx.beginPath()
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY)
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY)
    ctx.stroke()
  }

  function stopDrawing() {
    setIsDrawing(false)
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  function saveFromCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return ''
    return canvas.toDataURL('image/png')
  }

  function handleNew() {
    setEditing(null)
    setFormData({ nombre: '', titulo: '', rol: '', firma_data_url: '' })
    setCanvasDirty(false)
    setOpen(true)
  }

  function handleEdit(f: any) {
    setEditing(f)
    setFormData({ nombre: f.nombre, titulo: f.titulo || '', rol: f.rol || '', firma_data_url: f.firma_data_url })
    setCanvasDirty(false)
    setOpen(true)
  }

  async function handleSubmit() {
    try {
      if (!laboratorioId) return
      if (!formData.nombre) {
        alert('El nombre es obligatorio')
        return
      }
      if (!formData.rol || !ROLES_REQUERIDOS.includes(formData.rol)) {
        alert('El rol es obligatorio y debe ser uno de los requeridos')
        return
      }
      if (firmas.some((f) => f.rol === formData.rol && (!editing || f.id !== editing.id))) {
        alert('Ya existe una firma registrada para este rol')
        return
      }
      const firmaDataUrl = editing
        ? (canvasDirty ? saveFromCanvas() : formData.firma_data_url)
        : saveFromCanvas()
      if (!firmaDataUrl || firmaDataUrl === 'data:,') {
        alert('Debe dibujar la firma')
        return
      }
      if (editing) {
        const { error } = await supabase.from('firmas').update({
          nombre: formData.nombre,
          titulo: formData.titulo,
          rol: formData.rol,
          firma_data_url: firmaDataUrl,
        }).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('firmas').insert({
          laboratorio_id: laboratorioId,
          nombre: formData.nombre,
          titulo: formData.titulo,
          rol: formData.rol,
          firma_data_url: firmaDataUrl,
          activo: true,
        })
        if (error) throw error
      }
      setOpen(false)
      loadFirmas()
    } catch (err: any) {
      alert('Error al guardar: ' + err.message)
    }
  }

  async function handleDelete(id: string) {
    if (confirm('¿Eliminar esta firma?')) {
      const { error } = await supabase.from('firmas').delete().eq('id', id)
      if (error) alert('Error al eliminar: ' + error.message)
      else loadFirmas()
    }
  }

  if (!laboratorioId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <PenTool className="size-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-heading text-lg font-semibold text-primary">No hay laboratorio registrado</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Primero debes crear tu laboratorio.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Firmas</h1>
          <p className="text-sm text-muted-foreground">Profesionales del laboratorio y sus firmas</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="size-4" />
          Nueva firma
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {firmas.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No hay firmas registradas. Haz clic en "Nueva firma" para agregar una.
          </div>
        ) : (
          firmas.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-primary">{f.nombre}</p>
                    {f.rol && <p className="text-sm text-muted-foreground">{f.rol}</p>}
                    {f.titulo && <p className="text-xs text-muted-foreground">{f.titulo}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(f)}>
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg bg-white p-2">
                  <img src={f.firma_data_url} alt={`Firma de ${f.nombre}`} className="w-full h-24 object-contain" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar firma' : 'Nueva firma'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Actualiza los datos del profesional' : 'Agrega un profesional y dibuja su firma'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre completo del profesional</label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre y apellidos"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Rol del profesional (obligatorio)</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">Seleccione un rol</option>
                {ROLES_REQUERIDOS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Título / Cargo (opcional)</label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ej. Técnico Dental, Protesista Dental"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Firma</label>
                <Button type="button" variant="ghost" size="sm" onClick={clearCanvas} className="gap-1">
                  <RotateCcw className="size-3" />
                  Limpiar
                </Button>
              </div>
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="w-full border rounded-lg bg-white cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <p className="text-xs text-muted-foreground mt-1">Dibuja la firma con el ratón o dedo</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editing ? 'Actualizar' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

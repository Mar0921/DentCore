'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, Upload, Trash2, FileText } from 'lucide-react'

const BUCKET = 'fichas-tecnicas'

interface FichaTecnica {
  id: string
  solicitud_id: string
  laboratorio_id: string | null
  nombre_archivo: string | null
  archivo_url: string | null
  tipo_mime: string | null
  tamaño_bytes: number | null
  notas: string | null
  created_at: string
}

function isViewableDocument(nombreArchivo?: string | null, tipoMime?: string | null) {
  if (!nombreArchivo && !tipoMime) return false
  const source = `${nombreArchivo || ''} ${tipoMime || ''}`.toLowerCase()
  return /\.(pdf|jpg|jpeg|png|gif|webp|svg)$/.test(source) || source.includes('pdf') || source.includes('image/')
}

export default function FichasTecnicasManagerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const solicitudId = searchParams.get('solicitud_id') || ''

  const [fichas, setFichas] = useState<FichaTecnica[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [fichaFile, setFichaFile] = useState<File | null>(null)
  const [notas, setNotas] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!solicitudId) {
      setLoading(false)
      return
    }
    async function load() {
      try {
        const res = await fetch(`/api/fichas-tecnicas?solicitud_id=${encodeURIComponent(solicitudId)}`)
        if (!res.ok) return
        const result = await res.json()
        setFichas(result.data || [])
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [solicitudId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!solicitudId || !fichaFile) return
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('archivo', fichaFile)
      formData.append('solicitud_id', solicitudId)
      formData.append('laboratorio_id', '')
      formData.append('notas', notas)

      const res = await fetch('/api/fichas-tecnicas', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Error al guardar')
      }

      const result = await res.json()
      setFichas((prev) => [result.data, ...prev])
      setFichaFile(null)
      setNotas('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (e: any) {
      alert('Error al guardar: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(fichaId: string) {
    if (!confirm('¿Eliminar ficha técnica?')) return
    try {
      const res = await fetch(`/api/fichas-tecnicas?id=${encodeURIComponent(fichaId)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Error al eliminar')
      setFichas((prev) => prev.filter((f) => f.id !== fichaId))
    } catch (e: any) {
      alert('Error al eliminar: ' + e.message)
    }
  }

  const backUrl = solicitudId ? `/laboratorio/solicitudes/${solicitudId}` : '/laboratorio/solicitudes'

  if (loading) {
    return (
      <div className="p-4">
        <Card><CardContent>Cargando fichas técnicas…</CardContent></Card>
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="p-4">Cargando fichas técnicas…</div>}>
      <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="size-4" />
          Volver
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Gestor de fichas técnicas</h1>
          <p className="text-sm text-muted-foreground">
            {solicitudId ? `Solicitud: ${solicitudId}` : 'Todas las solicitudes'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentos técnicos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ul className="divide-y divide-border">
              {fichas.length > 0 ? (
                fichas.map((ficha) => {
                  const href = ficha.archivo_url || null
                  const isViewable = isViewableDocument(ficha.nombre_archivo, ficha.tipo_mime)
                  return (
                    <li key={ficha.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {isViewable && href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-primary text-sm truncate max-w-[220px]"
                          >
                            {ficha.nombre_archivo || 'Ficha técnica'}
                          </a>
                        ) : (
                          <span className="text-sm text-foreground truncate max-w-[220px]">
                            {ficha.nombre_archivo || 'Ficha técnica'}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(ficha.created_at).toLocaleString('es-ES')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {href && !isViewable && (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs underline text-primary"
                          >
                            Descargar
                          </a>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(ficha.id)}>
                          <Trash2 className="size-4" />
                          Eliminar
                        </Button>
                      </div>
                    </li>
                  )
                })
              ) : (
                <li className="py-3">
                  <span className="text-sm text-muted-foreground">Sin fichas técnicas registradas</span>
                </li>
              )}
            </ul>

            <form className="mt-6 grid gap-3" onSubmit={handleSubmit}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setFichaFile(e.target.files?.[0] || null)}
              />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="size-4" />
                  Seleccionar archivo
                </Button>
                {fichaFile && <span className="text-xs text-muted-foreground self-center">{fichaFile.name}</span>}
              </div>
              <Textarea
                placeholder="Notas de la ficha técnica"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <Button type="submit" size="sm" disabled={uploading || !fichaFile}>
                {uploading ? <FileText className="size-4 animate-spin" /> : <FileText className="size-4" />}
                {uploading ? 'Subiendo…' : 'Subir ficha técnica'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
      </Suspense>
  )
}

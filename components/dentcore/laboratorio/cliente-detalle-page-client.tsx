'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Mail, Phone, Building2, FileText, ArrowLeft, CheckCircle, Clock, ClipboardList, Eye } from 'lucide-react'

export function ClienteDetallePageClient() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [cliente, setCliente] = useState<any>(null)
  const [carta, setCarta] = useState<any>(null)
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) loadCliente()
  }, [id])

  async function loadCliente() {
    setLoading(true)
    try {
      const { data } = await supabase.from('cliente').select('*').eq('id', id).maybeSingle()
      if (data) setCliente(data)
      const { data: cartaData } = await supabase.from('cartas_convenio').select('*').eq('cliente_id', id).maybeSingle()
      if (cartaData) setCarta(cartaData)
      
      // Intentar obtener solicitudes por cliente_id (tabla puede ser 'solicitudes')
      let solData = await supabase.from('solicitudes').select('*').eq('cliente_id', id)
      if (solData.data && solData.data.length > 0) {
        setSolicitudes(solData.data)
        return
      }
      solData = await supabase.from('solicitud').select('*').eq('cliente_id', id)
      if (solData.data && solData.data.length > 0) {
        setSolicitudes(solData.data)
        return
      }
      // Buscar por odontologo_id o por otros campos
      if (data?.email) {
        solData = await supabase.from('solicitudes').select('*').or(`odontologo_id.eq.${id},odontologonombre.eq.${data.nombre},odontologonombre.eq.${data.clinica}`).limit(100)
        if (solData.data && solData.data.length > 0) {
          setSolicitudes(solData.data)
          return
        }
        solData = await supabase.from('solicitud').select('*').or(`odontologo_id.eq.${id},odontologonombre.eq.${data.nombre},odontologonombre.eq.${data.clinica}`).limit(100)
        if (solData.data) setSolicitudes(solData.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Cargando...</div>
  }

  async function subirFactura(sol: any, file: File) {
    try {
      const ext = file.name.split('.').pop() || ''
      const storagePath = `public/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('solicitudes-documentos')
        .upload(storagePath, file)
      if (uploadError) { console.error('uploadError', uploadError); throw uploadError }
      const { data: { publicUrl } } = supabase.storage
        .from('solicitudes-documentos')
        .getPublicUrl(storagePath)
      const { error: updErr } = await supabase.from('solicitudes').update({ factura_url: publicUrl }).eq('id', sol.id)
      if (updErr) { console.error('updateError', updErr); throw updErr }
      loadCliente()
    } catch (err) {
      console.error(err)
    }
  }
  if (!cliente) {
    return <div className="p-6 text-center text-muted-foreground">Cliente no encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">Perfil del Cliente</h1>
            <p className="text-sm text-muted-foreground">{cliente.nombre}</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/laboratorio/carta-convenio?cliente=${cliente.id}`)} className="gap-2">
          <FileText className="size-4" />
          Ver Carta Convenio
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Datos del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Nombre</p>
              <p className="text-sm font-medium">{cliente.nombre || 'â€”'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{cliente.email || 'â€”'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">TelÃ©fono</p>
              <p className="text-sm font-medium">{cliente.telefono || cliente.celular || 'â€”'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">ClÃ­nica</p>
              <p className="text-sm font-medium">{cliente.clinica || 'â€”'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-5" />
            Solicitudes del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {solicitudes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay solicitudes registradas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium">Código</th>
                    <th className="text-left p-2 text-sm font-medium">Paciente</th>
                    <th className="text-left p-2 text-sm font-medium">Fecha</th>
                    <th className="text-left p-2 text-sm font-medium">Estado</th>
                    <th className="text-right p-2 text-sm font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((sol) => (
                    <tr key={sol.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm font-medium">{sol.codigo || sol.id.slice(0, 8)}</td>
                      <td className="p-2 text-sm">{sol.paciente_nombre || sol.nombre_paciente || '—'}</td>
                      <td className="p-2 text-sm">{(sol.fecha_creacion || sol.created_at || sol.fecha) ? new Date(sol.fecha_creacion || sol.created_at || sol.fecha).toLocaleDateString('es-CO') : '—'}</td>
                      <td className="p-2 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          sol.estado === 'Finalizado' ? 'bg-green-100 text-green-800' : 
                          sol.estado === 'En proceso' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sol.estado || 'Pendiente'}
                        </span>
                      </td>
                      <td className="p-2 text-sm text-right">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/laboratorio/solicitudes/${sol.id}`)}>
                          <Eye className="size-4 mr-1" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Estado de cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm font-bold mb-3">Total a pagar: {solicitudes.reduce((sum, s) => { const m = (s.productos || '').match(/a\s*\$([\d.,]+)/gi); const p = m ? m.reduce((a, x) => a + (parseFloat(x.replace(/a\s*\$/i, '').replace(/\./g, '').replace(',', '.')) || 0), 0) : (Number(s.precio) || Number(s.total) || 0); return sum + p; }, 0).toLocaleString('es-CO')}</p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 text-left">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Servicio</th>
                  <th className="px-3 py-2">Solicitud</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Estado Pago</th>
                  <th className="px-3 py-2">Factura</th>
                  <th className="px-3 py-2">Comprobante</th>
                  <th className="px-3 py-2 text-right">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {solicitudes.map((s, i) => (
                  <tr key={s.id || i}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{(s.productos || s.servicio || s.tipo_trabajo || '—').toString().replace(/\s*a\s*\$[\d.,]+/gi, '')}</td>
                    <td className="px-3 py-2">#{s.codigo || s.numero || s.id}</td>
                    <td className="px-3 py-2">{(s.fecha_creacion || s.created_at || s.fecha) ? new Date(s.fecha_creacion || s.created_at || s.fecha).toLocaleDateString('es-CO') : '—'}</td>
                    <td className="px-3 py-2">{s.estado || 'en proceso'}</td>
                    <td className="px-3 py-2">{s.estado_pago || 'pendientePago'}</td>
                    <td className="px-3 py-2">{s.factura_url ? <a href={s.factura_url} target="_blank" rel="noreferrer" className="text-primary underline">Ver factura</a> : <label className="text-primary underline cursor-pointer">Subir factura<input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) subirFactura(s, f) }} /></label>}</td>
                    <td className="px-3 py-2">{s.comprobante_url ? <a href={s.comprobante_url} target="_blank" rel="noreferrer" className="text-primary underline">Ver comprobante</a> : <span className="text-muted-foreground">Sin comprobante</span>}</td>
                    <td className="px-3 py-2 text-right font-mono">{(() => { const m = (s.productos || '').match(/a\s*\$([\d.,]+)/gi); if (!m) return (Number(s.precio) || Number(s.total) || 0).toLocaleString('es-CO'); return m.reduce((sum, x) => { const n = parseFloat(x.replace(/a\s*\$/i, '').replace(/\./g, '').replace(',', '.')); return sum + (isNaN(n) ? 0 : n); }, 0).toLocaleString('es-CO'); })()}</td>
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

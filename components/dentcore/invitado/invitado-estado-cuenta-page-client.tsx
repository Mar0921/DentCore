'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function formatoPrecio(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`
}

export function InvitadoEstadoCuentaPageClient() {
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSolicitudes()
  }, [])

  async function loadSolicitudes() {
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

  const totalAPagar = useMemo(
    () => solicitudes.reduce((sum, s) => { const m = (s.productos || '').match(/a\s*\$([\d.,]+)/gi); const p = m ? m.reduce((a, x) => a + (parseFloat(x.replace(/a\s*\$/i, '').replace(/\./g, '').replace(',', '.')) || 0), 0) : (Number(s.precio) || Number(s.total) || 0); return sum + p; }, 0),
    [solicitudes],
  )

  async function subirComprobante(s: any, file: File) {
    try {
      const ext = file.name.split('.').pop() || ''
      const storagePath = `public/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('solicitudes-documentos').upload(storagePath, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('solicitudes-documentos').getPublicUrl(storagePath)
      await supabase.from('solicitudes').update({ comprobante_url: publicUrl }).eq('id', s.id)
      loadSolicitudes()
    } catch (err) {
      console.error(err)
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary">Estado de cuenta</h1>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Total a pagar: {formatoPrecio(totalAPagar)}</CardTitle>
          </CardHeader>
          <CardContent>
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
                      <td className="px-3 py-2">#{s.numero || s.id}</td>
                      <td className="px-3 py-2">{s.fecha || (s.created_at ? new Date(s.created_at).toLocaleDateString('es-CO') : '')}</td>
                      <td className="px-3 py-2">{s.estado || 'en proceso'}</td>
                      <td className="px-3 py-2">{s.estado_pago || 'pendientePago'}</td>
                      <td className="px-3 py-2">
                        {s.factura_url ? (
                          <a href={s.factura_url} target="_blank" rel="noreferrer" className="text-primary underline">Ver factura</a>
                        ) : (
                          <span className="text-muted-foreground">Sin factura</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {s.comprobante_url ? (
                          <a href={s.comprobante_url} target="_blank" rel="noreferrer" className="text-primary underline">Ver comprobante</a>
                        ) : (
                          <label className="text-primary underline cursor-pointer">Subir comprobante<input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) subirComprobante(s, f) }} /></label>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{(() => { const m = (s.productos || '').match(/a\s*\$([\d.,]+)/gi); if (!m) return formatoPrecio(Number(s.precio) || Number(s.total) || 0); return formatoPrecio(m.reduce((sum, x) => sum + (parseFloat(x.replace(/a\s*\$/i, '').replace(/\./g, '').replace(',', '.')) || 0), 0)); })()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

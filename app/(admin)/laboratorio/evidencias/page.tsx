'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function EvidenciasPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('fases_evidencias')
        .select('*, empleados(nombre), solicitudes(id, codigo_trazabilidad)')
        .order('creado_en', { ascending: false })
      if (error) {
        console.error('Error loading evidencias:', error)
        setError(error.message)
      } else {
        setRows(data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-6">Cargando…</div>
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Evidencias</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left">Empleado</th>
              <th className="px-4 py-2 text-left">Solicitud</th>
              <th className="px-4 py-2 text-left">Fecha</th>
              <th className="px-4 py-2 text-left">Evidencia</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="px-4 py-2">{r.empleados?.nombre || r.empleado_id || '—'}</td>
                <td className="px-4 py-2">{r.solicitudes?.codigo_trazabilidad || r.solicitud_id || '—'}</td>
                <td className="px-4 py-2">{r.creado_en ? new Date(r.creado_en).toLocaleString() : '—'}</td>
                <td className="px-4 py-2">
                  <a href={r.archivo_url} target="_blank" rel="noreferrer" className="text-primary underline">
                    Ver
                  </a>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No hay evidencias
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
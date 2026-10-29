'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

import { AppShell } from '@/components/dentcore/app-shell'

export default function EmpleadoEvidenciasPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      let empleadoId: string | null = null
      if (user) {
        const { data: emp } = await supabase
          .from('empleados')
          .select('id')
          .eq('email', user.email || '')
          .maybeSingle()
        if (emp) empleadoId = emp.id
      }
      let q = supabase
        .from('fases_evidencias')
        .select('*, empleados(nombre), solicitudes(id, codigo_trazabilidad)')
        .order('creado_en', { ascending: false })
      if (empleadoId) q = q.eq('empleado_id', empleadoId)
      const { data } = await q
      setRows(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <AppShell sidebar="empleado">
      <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Evidencias</h1>
      {loading ? (
        <p>Cargando…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Solicitud</th>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-left">Evidencia</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
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
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No hay evidencias
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </AppShell>
  )
}

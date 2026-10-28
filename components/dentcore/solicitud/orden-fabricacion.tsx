'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function OrdenFabricacion({ solicitud }: { solicitud: any }) {
  const [lab, setLab] = useState<any>(null)
  const [fases, setFases] = useState<any[]>([])
  const [obs, setObs] = useState<{ fecha: string; texto: string }[]>([])
  const [obsText, setObsText] = useState('')

  useEffect(() => {
    if (!solicitud?.laboratorio_id) return
    let cancelled = false
    supabase
      .from('fases')
      .select('id, nombre, orden')
      .eq('laboratorio_id', solicitud.laboratorio_id)
      .order('orden', { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setFases(data || [])
      })
    return () => {
      cancelled = true
    }
  }, [solicitud?.laboratorio_id])

  useEffect(() => {
    if (!solicitud?.laboratorio_id) return
    let cancelled = false
    supabase
      .from('laboratorio')
      .select('*')
      .eq('id', solicitud.laboratorio_id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setLab(data)
      })
    return () => {
      cancelled = true
    }
  }, [solicitud?.laboratorio_id])

  const nombre = lab?.nombre || '—'
  const direccion = lab?.direcccion || lab?.direccion || '—'
  const ciudad = lab?.ciudad || ''
  const telefono = lab?.telefono || '—'

  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-4 text-sm">
      <h2 className="mb-4 text-lg font-bold">ORDEN DE FABRICACIÓN</h2>

      <section className="mb-4">
        <h3 className="font-semibold">Fabricante</h3>
        <p>{nombre}</p>
        <p>{direccion}</p>
        {ciudad ? <p>{ciudad}</p> : null}
        <p>{telefono}</p>
      </section>

      <section className="mb-4">
        <h3 className="font-semibold">Técnico Responsable</h3>
        <p>Jazmín Valencia</p>
      </section>

      <section className="mb-4">
        <h3 className="font-semibold">Código de trazabilidad</h3>
        <p>{solicitud?.codigo_trazabilidad || '—'}</p>
      </section>

      <section className="mb-4">
        <h3 className="font-semibold">Piezas enviadas</h3>
        <p>{solicitud?.piezas_enviadas || '—'}</p>
      </section>

      <section className="mb-4">
        <h3 className="font-semibold">DETALLES DEL TRABAJO</h3>
        <p>Paciente: {solicitud?.paciente || '—'}</p>
        <p>Doctor/a: {solicitud?.odontologonombre || '—'}</p>
        <p>Cliente: {solicitud?.odontologonombre || '—'}</p>
        <p>Color: {solicitud?.color || '—'}</p>
      </section>

      <section className="mb-4">
        <h3 className="font-semibold">PRODUCTOS</h3>
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr>
              <th className="border border-border p-1">#</th>
              <th className="border border-border p-1">Producto</th>
              <th className="border border-border p-1">Unidades</th>
              <th className="border border-border p-1">Dientes</th>
            </tr>
          </thead>
          <tbody>
            {(solicitud?.productos || '')
              .split(';')
              .map((p: string) => p.trim())
              .filter(Boolean)
              .map((p: string, i: number) => {
                const m = p.match(/^(.*) x(\d+) \(([^)]*)\)/)
                const producto = m ? m[1].trim() : p
                const unidades = m ? m[2] : '—'
                const dientes = m ? m[3].trim() : '—'
                return (
                  <tr key={i}>
                    <td className="border border-border p-1">{i + 1}</td>
                    <td className="border border-border p-1">{producto}</td>
                    <td className="border border-border p-1">{unidades}</td>
                    <td className="border border-border p-1">{dientes}</td>
                  </tr>
                )
              })}
            {!solicitud?.productos && (
              <tr>
                <td className="border border-border p-1">—</td>
                <td className="border border-border p-1">—</td>
                <td className="border border-border p-1">—</td>
                <td className="border border-border p-1">—</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="mb-4">
        <h3 className="font-semibold">MATERIALES EMPLEADOS</h3>
        <button className="text-primary underline">Agregar material</button>
      </section>

      <section className="mb-4">
        <h3 className="font-semibold">FASES DE FABRICACIÓN</h3>
        {fases.length > 0 ? (
          <ul className="list-disc pl-5">
            {fases.map((f: any) => (
              <li key={f.id}>{f.orden}. {f.nombre}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Sin fases registradas.</p>
        )}
      </section>

      <section className="mb-4">
        <h3 className="font-semibold">INCIDENCIAS</h3>
        <p className="text-muted-foreground">Sin incidencias registradas.</p>
      </section>

      <section className="mb-4">
        <h3 className="font-semibold">OBSERVACIONES</h3>
        <div className="mb-2 flex gap-2">
          <input
            value={obsText}
            onChange={(e) => setObsText(e.target.value)}
            placeholder="Escribir observación..."
            className="flex-1 rounded border border-border bg-card p-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              if (!obsText.trim()) return
              setObs((prev) => [
                ...prev,
                { fecha: new Date().toLocaleDateString('es-ES'), texto: obsText.trim() },
              ])
              setObsText('')
            }}
            className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
          >
            Agregar
          </button>
        </div>
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr>
              <th className="border border-border p-1">Fecha</th>
              <th className="border border-border p-1">Observación</th>
            </tr>
          </thead>
          <tbody>
            {obs.map((o, i) => (
              <tr key={i}>
                <td className="border border-border p-1">{o.fecha}</td>
                <td className="border border-border p-1">{o.texto}</td>
              </tr>
            ))}
            {obs.length === 0 && (
              <tr>
                <td className="border border-border p-1">—</td>
                <td className="border border-border p-1">—</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <footer className="mt-4 text-xs text-muted-foreground">GF-FO-002 version 001</footer>
    </div>
  )
}

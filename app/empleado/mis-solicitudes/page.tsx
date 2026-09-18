'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card'
import { AppShell } from '@/components/dentcore/app-shell'
import { supabase } from '@/lib/supabase'

interface SolicitudLite {
  id: string
  tipo: string | null
  estado: string | null
  prioridad: string | null
  progreso: number | null
  asignado_a: string | null
  odontologonombre: string | null
  paciente: string | null
  created_at: string
  updated_at: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-muted text-muted-foreground' },
  en_progreso: { label: 'En progreso', color: 'bg-primary/10 text-primary' },
  completada: { label: 'Completada', color: 'bg-accent/15 text-accent' },
  entregada: { label: 'Entregada', color: 'bg-accent/15 text-accent' },
  cancelada: { label: 'Cancelada', color: 'bg-destructive/10 text-destructive' },
}

export default function EmpleadoSolicitudesPage() {
  const router = useRouter()
  const [solicitudes, setSolicitudes] = useState<SolicitudLite[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSolicitudes() {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('solicitudes')
          .select('id, tipo, estado, prioridad, progreso, asignado_a, odontologonombre, paciente, created_at, updated_at')
          .order('created_at', { ascending: false })

        setSolicitudes(data || [])
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }

    loadSolicitudes()
  }, [])

  const filtered = solicitudes.filter((s) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      (s.paciente || '').toLowerCase().includes(term) ||
      (s.odontologonombre || '').toLowerCase().includes(term) ||
      (s.tipo || '').toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term)
    )
  })

  return (
    <AppShell sidebar="empleado">
      <div className="space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Solicitudes</h1>
          <p className="text-sm text-muted-foreground">Solicitudes registradas en el laboratorio</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar solicitud..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No hay solicitudes para mostrar.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map((s) => {
              const status = statusConfig[s.estado || ''] || { label: s.estado || '—', color: 'bg-muted text-muted-foreground' }
              return (
                <Card key={s.id} className="border border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base">
                        {s.tipo || 'Sin tipo'} · <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
                      </CardTitle>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <CardDescription>
                      {s.paciente || '—'} · {s.odontologonombre || '—'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between pb-3">
                    <p className="text-xs text-muted-foreground">
                      Progreso: {s.progreso ?? 0}%
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => router.push(`/empleado/mis-solicitudes/${s.id}`)}
                    >
                      <Eye className="size-4" />
                      Ver detalle
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}

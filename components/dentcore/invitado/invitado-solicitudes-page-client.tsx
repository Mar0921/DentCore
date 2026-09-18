'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Search, FileText, Plus } from 'lucide-react'

const ESTADOS_FINALIZADOS = new Set([
  'completada',
  'entregada',
  'finalizada',
  'terminada',
  'cerrada',
  'completed',
  'delivered',
  'finalizado',
  'done',
])

const tabs = [
  { key: 'activas', label: 'No finalizadas' },
  { key: 'finalizadas', label: 'Finalizadas' },
] as const

type Tab = (typeof tabs)[number]['key']

export function InvitadoSolicitudesPageClient() {
  const router = useRouter()
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('activas')

  useEffect(() => {
    loadSolicitudes()
  }, [])

  async function loadSolicitudes() {
    setLoading(true)
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

  const tituloSolicitud = (s: any) =>
    s.codigo_trazabilidad
      ? `${s.codigo_trazabilidad}${s.productos ? ` · ${s.productos}` : ''}`
      : `Solicitud ${s.id}`

  const isFinalizada = (s: any) => ESTADOS_FINALIZADOS.has(String(s.estado || '').toLowerCase())

  const filtered = useMemo(() => {
    if (!search) return solicitudes
    const term = search.toLowerCase()
    return solicitudes.filter((s) => {
      return (
        tituloSolicitud(s).toLowerCase().includes(term) ||
        (s.tipo || '').toLowerCase().includes(term) ||
        (s.estado || '').toLowerCase().includes(term) ||
        String(s.id || '').toLowerCase().includes(term)
      )
    })
  }, [solicitudes, search])

  const solicitudesActivas = useMemo(() => filtered.filter((s) => !isFinalizada(s)), [filtered])
  const solicitudesFinalizadas = useMemo(() => filtered.filter((s) => isFinalizada(s)), [filtered])

  const visibleList = tab === 'finalizadas' ? solicitudesFinalizadas : solicitudesActivas

  const renderList = (list: any[]) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="mx-auto size-12 mb-2 opacity-50" />
          <p>No hay solicitudes en esta sección</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {list.map((s) => (
          <Card
            key={s.id}
            className="cursor-pointer border border-border p-4 transition-colors hover:bg-secondary/50"
            onClick={() => router.push(`/invitado-laboratorio/solicitudes/${s.id}`)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{tituloSolicitud(s)}</CardTitle>
              <CardDescription>{s.tipo || 'Sin tipo'}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-xs text-muted-foreground">
                Estado: {s.estado || 'sin estado'}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(s.created_at).toLocaleDateString('es-CO')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Mis Solicitudes</h1>
          <p className="text-sm text-muted-foreground">Listado de solicitudes registradas</p>
        </div>
        <Button className="gap-2" onClick={() => router.push('/invitado-laboratorio/solicitudes/nueva')}>
          <Plus className="size-4" />
          Nueva solicitud
        </Button>
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

      <nav className="flex items-center gap-0.5 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        renderList(visibleList)
      )}
    </div>
  )
}


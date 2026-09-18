'use client'

import { useState, useEffect } from 'react'
import { MoreHorizontal, Eye, Plus, Search, FlaskConical, Users, UserRound, ClipboardList, TrendingUp, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'

export function AdminDashboard() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [lab, setLab] = useState<any>(null)
  const [empleados, setEmpleados] = useState<any[]>([])
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: labs } = await supabase.from('laboratorio').select('*').limit(1)
      if (labs && labs.length > 0) {
        console.log('Laboratorio cargado:', labs[0])
        setLab(labs[0])
        const { data: emps } = await supabase.from('empleados').select('*').eq('laboratorio_id', labs[0].id)
        if (emps) setEmpleados(emps)
        const { data: sols } = await supabase.from('solicitudes').select('*').eq('laboratorio_id', labs[0].id)
        if (sols) setSolicitudes(sols)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const logoToShow = logoPreview || lab?.logo_url || null
  const activeEmployees = empleados.filter((e) => e.activo).length
  const pendingRequests = solicitudes.filter((r) => r.estado === 'pendiente').length
  const inProgressRequests = solicitudes.filter((r) => r.estado === 'en_proceso').length

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>
  }

  if (!lab) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">No hay laboratorio registrado. Ve a la página de suscripción.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Panel de administración</h1>
          <p className="mt-1 text-sm text-muted-foreground">Información general del laboratorio, solicitudes y equipo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2" onClick={() => router.push('/laboratorio/solicitudes/nueva')}>
            <Plus className="size-4" />
            Nueva solicitud
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Información del laboratorio</CardTitle>
            <FlaskConical className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-full border border-dashed border-border bg-secondary">
                {logoToShow ? (
                  <img src={logoToShow} alt="Logo" className="size-12 rounded-full object-cover" />
                ) : (
                  <FlaskConical className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm font-bold text-primary">{lab.nombre}</p>
                <p className="text-xs text-muted-foreground">{lab.email}</p>
                <p className="text-xs text-muted-foreground">{lab.telefono}</p>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-accent hover:underline">
                  <Upload className="size-3.5" />
                  {logoToShow ? 'Cambiar logo' : 'Subir logo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Empleados activos</CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{activeEmployees}</p>
            <p className="text-xs text-muted-foreground">de {empleados.length} registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Solicitudes</CardTitle>
            <ClipboardList className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{solicitudes.length}</p>
            <p className="text-xs text-muted-foreground">
              {pendingRequests} pendientes · {inProgressRequests} en proceso
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Solicitudes recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {solicitudes.length === 0 ? (
            <p className="text-center text-muted-foreground">No hay solicitudes</p>
          ) : (
            <div className="space-y-2">
              {solicitudes.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-primary">{r.tipo}</p>
                    <p className="text-xs text-muted-foreground">{r.odontologonombre || 'Sin odontólogo'}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{r.estado}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
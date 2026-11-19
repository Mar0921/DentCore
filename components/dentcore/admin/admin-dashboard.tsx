'use client'

import { useState, useEffect } from 'react'
import { Plus, FlaskConical, Users, ClipboardList, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

// Nombre ÚNICO del bucket. Debe coincidir exactamente con el de Supabase Storage.
const LOGO_BUCKET = 'logos-laboratorio'

export function AdminDashboard() {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
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
      const { data: emps, error: empsError } = await supabase
        .from('empleados')
        .select('laboratorio_id')
        .not('laboratorio_id', 'is', null)
        .order('laboratorio_id', { ascending: true })
      if (empsError) console.error('Error empleados:', empsError)

      const labIds = (emps?.map((e: any) => e.laboratorio_id) || []).filter(Boolean)
      const labId = labIds.length > 0 ? labIds[0] : null

      if (labId) {
        const { data: labs, error: labError } = await supabase
          .from('laboratorio')
          .select('*')
          .eq('id', labId)
          .limit(1)
        if (labError) console.error('Error laboratorio:', labError)
        if (labs && labs.length > 0) setLab(labs[0])

        const { data: empsAll } = await supabase
          .from('empleados')
          .select('*')
          .eq('laboratorio_id', labId)
        if (empsAll) setEmpleados(empsAll)

        const { data: sols } = await supabase
          .from('solicitudes')
          .select('*')
          .eq('laboratorio_id', labId)
        if (sols) setSolicitudes(sols)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !lab?.id) return

    if (!file.type.startsWith('image/')) {
      alert('El archivo debe ser una imagen')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no puede pesar más de 2 MB')
      return
    }

    setUploadingLogo(true)
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase()
      const storagePath = `public/${lab.id}/${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 9)}.${ext}`

      // 1. Subir al bucket
      const { error: uploadError } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(storagePath, file, { upsert: true, contentType: file.type })

      if (uploadError) {
        console.error('Error subiendo al bucket:', uploadError)
        throw new Error('Storage: ' + uploadError.message)
      }

      // 2. URL pública
      const { data: urlData } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(storagePath)
      const publicUrl = urlData.publicUrl

      // 3. Guardar en la tabla y confirmar que se actualizó una fila
      const { data: updated, error: updateError } = await supabase
        .from('laboratorio')
        .update({ logo_url: publicUrl })
        .eq('id', lab.id)
        .select()

      if (updateError) {
        console.error('Error actualizando tabla:', updateError)
        throw new Error('Tabla laboratorio: ' + updateError.message)
      }
      if (!updated || updated.length === 0) {
        throw new Error(
          'Tabla laboratorio: no se actualizó ninguna fila (revisa la política RLS de UPDATE)'
        )
      }

      setLogoError(false)
      setLogoPreview(publicUrl)
      setLab({ ...lab, logo_url: publicUrl })
    } catch (err: any) {
      console.error('Error al subir logo:', err)
      alert('Error al subir el logo: ' + (err?.message ?? JSON.stringify(err)))
    } finally {
      setUploadingLogo(false)
      event.target.value = ''
    }
  }

  // Solo se usa la URL guardada si pertenece al bucket correcto
  const savedLogo =
    lab?.logo_url && String(lab.logo_url).includes(`/${LOGO_BUCKET}/`) ? lab.logo_url : null
  const logoToShow = logoPreview || savedLogo
  const showLogo = !!logoToShow && !logoError

  const activeEmployees = empleados.filter((e) => e.activo).length
  const pendingRequests = solicitudes.filter((r) => r.estado === 'pendiente').length
  const inProgressRequests = solicitudes.filter((r) => r.estado === 'en_proceso').length

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>
  }

  if (!lab) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">
          No hay laboratorio registrado. Ve a la página de suscripción.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Panel de administración</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Información general del laboratorio, solicitudes y equipo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2" onClick={() => router.push('/laboratorio/solicitudes/nueva')}>
            <Plus className="size-4" />
            Nueva solicitud
          </Button>
          <Button
            className="gap-2"
            variant="outline"
            onClick={() => router.push('/laboratorio/materiales')}
          >
            Materiales
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Información del laboratorio
            </CardTitle>
            <FlaskConical className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-secondary">
                {showLogo ? (
                  <img
                    src={logoToShow as string}
                    alt="Logo del laboratorio"
                    className="size-14 object-cover"
                    onError={() => {
                      console.error('No cargó el logo:', logoToShow)
                      setLogoError(true)
                    }}
                  />
                ) : (
                  <FlaskConical className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm font-bold text-primary">{lab.nombre}</p>
                <p className="text-xs text-muted-foreground">{lab.email}</p>
                <p className="text-xs text-muted-foreground">{lab.telefono}</p>
                <label
                  className={`inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline ${
                    uploadingLogo ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                  }`}
                >
                  <Upload className="size-3.5" />
                  {uploadingLogo ? 'Subiendo...' : showLogo ? 'Cambiar logo' : 'Subir logo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                    disabled={uploadingLogo}
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Empleados activos
            </CardTitle>
            <Users className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{activeEmployees}</p>
            <p className="text-xs text-muted-foreground">de {empleados.length} registrados</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:bg-secondary/50"
          onClick={() => router.push('/laboratorio/solicitudes')}
        >
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
                <div
                  key={r.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50"
                  onClick={() => router.push(`/laboratorio/solicitudes/${r.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-primary">{r.tipo}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.odontologonombre || 'Sin odontólogo'}
                    </p>
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
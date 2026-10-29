'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AppShell } from '@/components/dentcore/app-shell'
import { ChevronLeft, Save } from 'lucide-react'

const TIPOS_INCIDENCIA = [
  'Error de impresión',
  'Error de diseño',
  'Material defectuoso',
  'Desajuste',
  'Rotura',
  'Retraso',
  'Otro',
]

interface FaseLite {
  id: string
  nombre: string
  orden: number
}

interface Solicitud {
  id: string | number
  codigo_trazabilidad?: string | null
  paciente?: string | null
  odontologonombre?: string | null
  tipo?: string | null
  productos?: string | null
  notas?: string | null
  laboratorio_id?: string | null
}

function normalize(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function parseNombresProductos(productos?: string | null): string[] {
  const nombres = (productos || '')
    .split(/\n|;/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const match = p.match(/^(.+?)\s+x\d+\s*\(/i)
      return (match ? match[1] : p).trim()
    })
    .filter(Boolean)

  return Array.from(new Set(nombres))
}

// Lee el usuario que inició sesión (el login de la app guarda estos datos en localStorage).
function obtenerUsuarioLocal() {
  if (typeof window === 'undefined') return { email: '', nombre: '' }

  return {
    email: (localStorage.getItem('labUserEmail') || '').trim().toLowerCase(),
    nombre: (localStorage.getItem('labUserName') || '').trim(),
  }
}

export default function NuevaIncidenciaEmpleadoPage() {
  const router = useRouter()

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [fasesDisponibles, setFasesDisponibles] = useState<FaseLite[]>([])
  const [loading, setLoading] = useState(false)
  const [cargandoResponsable, setCargandoResponsable] = useState(true)

  const [formData, setFormData] = useState({
    solicitud_id: '',
    tipo: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    fase: '',
    descripcion: '',
    responsable: 'Usuario',
    estado: 'abierta',
  })

  useEffect(() => {
    void cargarSolicitudes()
    void cargarResponsableSesion()
  }, [])

  useEffect(() => {
    if (!formData.solicitud_id) {
      setFasesDisponibles([])
      setFormData((prev) => ({ ...prev, fase: '' }))
      return
    }

    void cargarFases(formData.solicitud_id)
  }, [formData.solicitud_id, solicitudes])

  // Obtiene el nombre del usuario que inició sesión (desde localStorage).
  async function cargarResponsableSesion(): Promise<string> {
    setCargandoResponsable(true)

    try {
      const { email, nombre } = obtenerUsuarioLocal()

      if (!email && !nombre) {
        return ''
      }

      let nombreResponsable = nombre

      // Si no hay nombre guardado, se busca el empleado por el correo.
      if (!nombreResponsable && email) {
        const { data: empleado, error } = await supabase
          .from('empleados')
          .select('nombre, email')
          .ilike('email', email)
          .maybeSingle()

        if (error) {
          console.error('Error consultando empleados:', error)
        }

        nombreResponsable =
          empleado?.nombre?.trim() || email.split('@')[0]
      }

      if (!nombreResponsable) {
        nombreResponsable = 'Usuario'
      }

      setFormData((prev) => ({
        ...prev,
        responsable: nombreResponsable,
      }))

      return nombreResponsable
    } catch (error) {
      console.error('Error cargando responsable:', error)
      return ''
    } finally {
      setCargandoResponsable(false)
    }
  }

  async function cargarSolicitudes() {
    try {
      const res = await fetch('/api/solicitudes?empleado=true')

      if (res.ok) {
        const result = await res.json()

        if (Array.isArray(result?.data) && result.data.length > 0) {
          setSolicitudes(result.data)
          return
        }
      }
    } catch (error) {
      console.error('Error cargando solicitudes de la API:', error)
    }

    try {
      const { data, error } = await supabase
        .from('solicitudes')
        .select(
          'id, codigo_trazabilidad, paciente, odontologonombre, tipo, productos, notas, laboratorio_id'
        )
        .order('created_at', { ascending: false })

      if (error) throw error

      setSolicitudes(data || [])
    } catch (error) {
      console.error('Error cargando solicitudes:', error)
      setSolicitudes([])
    }
  }

  async function cargarFases(solicitudId: string) {
    const solicitud = solicitudes.find(
      (s) => String(s.id) === solicitudId
    )

    const nombres = parseNombresProductos(solicitud?.productos)

    if (!solicitud || nombres.length === 0) {
      setFasesDisponibles([])
      return
    }

    try {
      const { data: productos, error: errorProductos } = await supabase
        .from('productos')
        .select('id, titulo, nombre')

      if (errorProductos) throw errorProductos

      const encontrados: any[] = []

      for (const nombre of nombres.map(normalize)) {
        const producto = (productos || []).find(
          (p: any) =>
            normalize(p.titulo) === nombre ||
            (normalize(p.nombre) !== '' &&
              normalize(p.nombre) === nombre)
        )

        if (
          producto &&
          !encontrados.some((p) => p.id === producto.id)
        ) {
          encontrados.push(producto)
        }
      }

      if (encontrados.length === 0) {
        setFasesDisponibles([])
        return
      }

      const { data: relaciones, error: errorRelaciones } =
        await supabase
          .from('producto_fases')
          .select('producto_id, fase_id, orden')
          .in(
            'producto_id',
            encontrados.map((p) => p.id)
          )
          .order('orden', { ascending: true })

      if (errorRelaciones) throw errorRelaciones

      const faseIds = Array.from(
        new Set((relaciones || []).map((r: any) => r.fase_id))
      )

      let fasesData: any[] = []

      if (faseIds.length > 0) {
        const { data, error } = await supabase
          .from('fases')
          .select('id, nombre')
          .in('id', faseIds)

        if (error) throw error

        fasesData = data || []
      }

      const nombrePorFase = new Map<string, string>(
        fasesData.map(
          (f: any) => [String(f.id), f.nombre] as [string, string]
        )
      )

      const vistos = new Set<string>()
      const lista: FaseLite[] = []

      for (const producto of encontrados) {
        for (
          const relacion of (relaciones || []).filter(
            (r: any) => r.producto_id === producto.id
          )
        ) {
          const faseId = String(relacion.fase_id)

          if (vistos.has(faseId)) continue

          vistos.add(faseId)

          const nombre = nombrePorFase.get(faseId)

          if (nombre) {
            lista.push({
              id: faseId,
              nombre,
              orden: relacion.orden,
            })
          }
        }
      }

      setFasesDisponibles(
        lista.sort((a, b) => a.orden - b.orden)
      )
    } catch (error) {
      console.error('Error cargando fases:', error)
      setFasesDisponibles([])
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (
      !formData.solicitud_id ||
      !formData.tipo ||
      !formData.fecha ||
      !formData.hora ||
      !formData.descripcion.trim()
    ) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }

    setLoading(true)

    try {
      // Verifica que haya un usuario con sesión iniciada (datos de localStorage).
      const { email } = obtenerUsuarioLocal()

      if (!email) {
        alert('Tu sesión ha expirado. Inicia sesión nuevamente.')
        router.push('/iniciar-sesion')
        return
      }

      // Vuelve a obtener el responsable del usuario actual.
      const responsableFinal = await cargarResponsableSesion()

      if (!responsableFinal.trim()) {
        alert(
          'No se pudo obtener el nombre del responsable. ' +
          'Verifica el nombre del empleado y su correo en la tabla empleados.'
        )
        return
      }

      const solicitud = solicitudes.find(
        (s) => String(s.id) === formData.solicitud_id
      )

      const res = await fetch('/api/incidencias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          solicitud_id: formData.solicitud_id,
          solicitud_codigo_trazabilidad:
            solicitud?.codigo_trazabilidad || null,
          tipo: formData.tipo,
          fecha: formData.fecha,
          hora: formData.hora,
          fase: formData.fase || null,
          responsable: responsableFinal,
          descripcion: formData.descripcion.trim(),
          estado: formData.estado,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(
          result.error || 'Error al crear la incidencia'
        )
      }

      router.push('/empleado/incidencias')
    } catch (error: any) {
      console.error('Error guardando incidencia:', error)
      alert('Error: ' + (error.message || 'No se pudo guardar la incidencia'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell sidebar="empleado">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">
              Nueva Incidencia
            </h1>
            <p className="text-sm text-muted-foreground">
              Registrar una nueva incidencia
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Datos de la incidencia
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="solicitud_id"
                    className="text-sm font-medium"
                  >
                    Solicitud *
                  </label>

                  <select
                    id="solicitud_id"
                    value={formData.solicitud_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        solicitud_id: e.target.value,
                        fase: '',
                      }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Seleccionar solicitud</option>

                    {solicitudes.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {(s.codigo_trazabilidad
                          ? s.codigo_trazabilidad + ' - '
                          : '') +
                          (s.paciente ||
                            s.odontologonombre ||
                            s.tipo ||
                            String(s.id).slice(0, 8))}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="tipo"
                    className="text-sm font-medium"
                  >
                    Tipo de incidencia *
                  </label>

                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tipo: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Seleccionar tipo</option>

                    {TIPOS_INCIDENCIA.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="fecha"
                    className="text-sm font-medium"
                  >
                    Fecha *
                  </label>

                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fecha: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="hora"
                    className="text-sm font-medium"
                  >
                    Hora *
                  </label>

                  <Input
                    id="hora"
                    type="time"
                    value={formData.hora}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        hora: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="fase"
                    className="text-sm font-medium"
                  >
                    Fase
                  </label>

                  <select
                    id="fase"
                    value={formData.fase}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fase: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={!formData.solicitud_id}
                  >
                    <option value="">Seleccionar fase...</option>

                    {fasesDisponibles.map((fase) => (
                      <option key={fase.id} value={fase.nombre}>
                        {fase.nombre}
                      </option>
                    ))}

                    {fasesDisponibles.length === 0 &&
                      formData.solicitud_id && (
                        <option value="" disabled>
                          No hay fases asociadas a los productos de la solicitud
                        </option>
                      )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="responsable"
                    className="text-sm font-medium"
                  >
                    Responsable
                  </label>

                  <Input
                    id="responsable"
                    value={
                      cargandoResponsable
                        ? 'Cargando responsable...'
                        : formData.responsable
                    }
                    readOnly
                    placeholder="No se encontró el nombre del usuario"
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="estado"
                    className="text-sm font-medium"
                  >
                    Estado
                  </label>

                  <select
                    id="estado"
                    value={formData.estado}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        estado: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="abierta">Abierta</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="resuelta">Resuelta</option>
                    <option value="cerrada">Cerrada</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="descripcion"
                  className="text-sm font-medium"
                >
                  Descripción *
                </label>

                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      descripcion: e.target.value,
                    }))
                  }
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Describe la incidencia detalladamente..."
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    cargandoResponsable ||
                    !formData.responsable.trim()
                  }
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Guardando...' : 'Guardar incidencia'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
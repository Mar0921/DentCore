'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Nombre de la tabla donde guardas los materiales (catálogo). Cámbialo si se llama distinto.
const TABLA_MATERIALES = 'materiales'

interface Incidencia {
  id: string
  codigo: string | null
  solicitud_id: string
  tipo: string | null
  fecha: string | null
  hora: string | null
  fase: string | null
  descripcion: string | null
  responsable: string | null
  estado: string | null
}

// Una fase de un producto (una fila de producto_fases)
interface FaseDeProducto {
  id: string // producto_fases.id
  faseId: string
  nombre: string
  orden: number
}

interface GrupoProducto {
  key: string
  titulo: string
  cantidad: string
  dientes: string
  fases: FaseDeProducto[]
}

// Avance de una fase dentro de una solicitud (tabla solicitud_fases)
interface Registro {
  estado: string
  realizado_por: string
  fecha_finalizacion: string
  fecha_prueba: string
}

// Material del catálogo del laboratorio
interface MaterialCatalogo {
  id: string
  codigo: string | null
  nombre: string | null
  material: string | null
  producto: string | null
  numero_lote: string | null
  marca_fabricante: string | null
  proveedor: string | null
}

// Material empleado en la orden (tabla solicitud_materiales).
// Guarda una copia de los datos al momento de agregarlo, para conservar la trazabilidad del lote.
interface MaterialOrden {
  id: string
  material_id: string | null
  material: string | null
  producto: string | null
  numero_lote: string | null
  marca_fabricante: string | null
  proveedor: string | null
}

const MATERIAL_ORDEN_COLUMNS = 'id, material_id, material, producto, numero_lote, marca_fabricante, proveedor'

// Observación guardada de la orden (tabla solicitud_observaciones)
interface Observacion {
  id: string
  texto: string
  created_at: string
}

const REGISTRO_VACIO: Registro = {
  estado: 'pendiente',
  realizado_por: '',
  fecha_finalizacion: '',
  fecha_prueba: '',
}

const ESTADO_FASE_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'completado', label: 'Completado' },
]

const INCIDENCIA_ESTADO_CLASS: Record<string, string> = {
  abierta: 'bg-red-100 text-red-800',
  en_proceso: 'bg-amber-100 text-amber-800',
  resuelta: 'bg-green-100 text-green-800',
  cerrada: 'bg-gray-100 text-gray-800',
}

const INPUT_CLASS = 'w-full rounded border border-border bg-card p-1 text-sm'

function capitalize(value?: string | null) {
  if (!value) return '—'
  const text = value.replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Formato manual para evitar desfases de zona horaria con "YYYY-MM-DD"
function formatFecha(value?: string | null) {
  if (!value) return '—'
  const [y, m, d] = value.slice(0, 10).split('-')
  if (!y || !m || !d) return value
  return `${d}/${m}/${y}`
}

function formatHora(value?: string | null) {
  if (!value) return '—'
  return value.slice(0, 5)
}

// Normaliza para comparar nombres: sin tildes, sin espacios extra, minúsculas
function normalize(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

interface ProductoSolicitud {
  nombre: string
  cantidad: string
  dientes: string
}

// "DISILICATOS x3 (11,12,13) a $200000.00; METAL  x1 (34) a $150000.00"
// -> [{ nombre: 'DISILICATOS', cantidad: '3', dientes: '11,12,13' }, { nombre: 'METAL', cantidad: '1', dientes: '34' }]
function parseProductosSolicitud(productos?: string | null): ProductoSolicitud[] {
  const lista: ProductoSolicitud[] = []
  for (const raw of (productos || '').split(';').map((p) => p.trim()).filter(Boolean)) {
    const m = raw.match(/^(.*?)\s+x(\d+)\s*\(([^)]*)\)/i)
    const nombre = (m ? m[1] : raw).trim()
    const cantidad = m ? m[2] : '—'
    const dientes = m ? m[3].trim() : '—'
    // Si el mismo producto aparece dos veces se junta en uno solo
    const existente = lista.find((p) => normalize(p.nombre) === normalize(nombre))
    if (existente) {
      const suma = Number(existente.cantidad) + Number(cantidad)
      existente.cantidad = Number.isNaN(suma) ? existente.cantidad : String(suma)
      if (dientes !== '—') existente.dientes = existente.dientes === '—' ? dientes : `${existente.dientes}, ${dientes}`
    } else {
      lista.push({ nombre, cantidad, dientes })
    }
  }
  return lista
}

export function OrdenFabricacion({ solicitud }: { solicitud: any }) {
  const [lab, setLab] = useState<any>(null)
  const [grupos, setGrupos] = useState<GrupoProducto[]>([])
  const [fasesLoading, setFasesLoading] = useState(false)
  const [empleados, setEmpleados] = useState<{ id: string; nombre: string }[]>([])
  const [registros, setRegistros] = useState<Record<string, Registro>>({})
  const [guardados, setGuardados] = useState<Record<string, Registro>>({})
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [avanceError, setAvanceError] = useState<string | null>(null)
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [incidenciasLoading, setIncidenciasLoading] = useState(false)
  const [incidenciasError, setIncidenciasError] = useState<string | null>(null)
  const [catalogoMateriales, setCatalogoMateriales] = useState<MaterialCatalogo[]>([])
  const [materiales, setMateriales] = useState<MaterialOrden[]>([])
  const [materialSel, setMaterialSel] = useState('')
  const [matSaving, setMatSaving] = useState(false)
  const [matDeletingId, setMatDeletingId] = useState<string | null>(null)
  const [matError, setMatError] = useState<string | null>(null)
  const [obs, setObs] = useState<Observacion[]>([])
  const [obsText, setObsText] = useState('')
  const [obsSaving, setObsSaving] = useState(false)
  const [obsError, setObsError] = useState<string | null>(null)

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

  useEffect(() => {
    let cancelled = false
    supabase
      .from('empleados')
      .select('id, nombre')
      .order('nombre')
      .then(({ data }) => {
        if (!cancelled && data) setEmpleados(data as { id: string; nombre: string }[])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Fases agrupadas por producto de la solicitud (productos -> producto_fases -> fases)
  useEffect(() => {
    const items = parseProductosSolicitud(solicitud?.productos)
    if (items.length === 0) {
      setGrupos([])
      return
    }

    let cancelled = false
    setFasesLoading(true)

    async function load() {
      try {
        const { data: productos, error: errProd } = await supabase
          .from('productos')
          .select('id, titulo, nombre')
        if (errProd) throw errProd

        // Producto de catálogo que corresponde a cada producto de la solicitud
        const emparejados = items.map((item) => {
          const n = normalize(item.nombre)
          const prod = (productos || []).find(
            (p: any) => normalize(p.titulo) === n || (normalize(p.nombre) !== '' && normalize(p.nombre) === n),
          )
          return { item, prod }
        })

        const productoIds = Array.from(
          new Set(emparejados.flatMap((e) => (e.prod ? [e.prod.id as string] : []))),
        )

        let relaciones: any[] = []
        let fasesData: any[] = []
        if (productoIds.length > 0) {
          const { data, error: errRel } = await supabase
            .from('producto_fases')
            .select('id, producto_id, fase_id, orden')
            .in('producto_id', productoIds)
            .order('orden', { ascending: true })
          if (errRel) throw errRel
          relaciones = data || []

          const faseIds = Array.from(new Set(relaciones.map((r) => r.fase_id)))
          if (faseIds.length > 0) {
            const { data: fd, error: errFases } = await supabase
              .from('fases')
              .select('id, nombre')
              .in('id', faseIds)
            if (errFases) throw errFases
            fasesData = fd || []
          }
        }

        const nombrePorFase = new Map<string, string>(
          fasesData.map((f: any) => [f.id, f.nombre] as [string, string]),
        )

        const resultado: GrupoProducto[] = emparejados.map(({ item, prod }, idx) => ({
          key: `${idx}-${item.nombre}`,
          titulo: item.nombre,
          cantidad: item.cantidad,
          dientes: item.dientes,
          fases: prod
            ? relaciones
                .filter((r) => r.producto_id === prod.id)
                .map((r) => ({
                  id: r.id,
                  faseId: r.fase_id,
                  orden: r.orden,
                  nombre: nombrePorFase.get(r.fase_id) || '—',
                }))
            : [],
        }))

        if (!cancelled) setGrupos(resultado)
      } catch (e) {
        console.error('Error cargando fases de los productos:', e)
        if (!cancelled) setGrupos([])
      } finally {
        if (!cancelled) setFasesLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [solicitud?.productos])

  // Avance guardado de cada fase para esta solicitud
  useEffect(() => {
    if (!solicitud?.id) {
      setRegistros({})
      setGuardados({})
      return
    }
    let cancelled = false
    setAvanceError(null)
    supabase
      .from('solicitud_fases')
      .select('producto_fase_id, estado, realizado_por, fecha_finalizacion, fecha_prueba')
      .eq('solicitud_id', solicitud.id)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Error cargando avance de fases:', error.message, error.code, error.details, error.hint)
          setAvanceError(
            `No se pudo cargar el avance de las fases: ${error.message}${error.code ? ` (${error.code})` : ''}`,
          )
          return
        }
        const mapa: Record<string, Registro> = {}
        for (const r of data || []) {
          mapa[r.producto_fase_id] = {
            estado: r.estado || 'pendiente',
            realizado_por: r.realizado_por || '',
            fecha_finalizacion: r.fecha_finalizacion || '',
            fecha_prueba: r.fecha_prueba || '',
          }
        }
        setRegistros(mapa)
        setGuardados(mapa)
      })
    return () => {
      cancelled = true
    }
  }, [solicitud?.id])

  function setCampo(productoFaseId: string, campo: keyof Registro, valor: string) {
    setRegistros((prev) => ({
      ...prev,
      [productoFaseId]: { ...(prev[productoFaseId] ?? REGISTRO_VACIO), [campo]: valor },
    }))
  }

  function estaModificado(productoFaseId: string) {
    const actual = registros[productoFaseId] ?? REGISTRO_VACIO
    const base = guardados[productoFaseId] ?? REGISTRO_VACIO
    return JSON.stringify(actual) !== JSON.stringify(base)
  }

  async function guardarFase(productoFaseId: string) {
    if (!solicitud?.id || guardandoId) return
    const r = registros[productoFaseId] ?? REGISTRO_VACIO
    setGuardandoId(productoFaseId)
    try {
      const { error } = await supabase.from('solicitud_fases').upsert(
        {
          solicitud_id: solicitud.id,
          producto_fase_id: productoFaseId,
          estado: r.estado,
          realizado_por: r.realizado_por || null,
          fecha_finalizacion: r.fecha_finalizacion || null,
          fecha_prueba: r.fecha_prueba || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'solicitud_id,producto_fase_id' },
      )
      if (error) throw error
      setGuardados((prev) => ({ ...prev, [productoFaseId]: { ...r } }))
    } catch (e: any) {
      console.error('Error guardando fase:', e?.message, e?.code, e?.details, e?.hint)
      alert('Error al guardar: ' + (e?.message || 'desconocido') + (e?.code ? ` (${e.code})` : ''))
    } finally {
      setGuardandoId(null)
    }
  }

  // Catálogo de materiales guardados del laboratorio (para el desplegable)
  useEffect(() => {
    let cancelled = false
    let query = supabase
      .from(TABLA_MATERIALES)
      .select('id, codigo, nombre, material, producto, numero_lote, marca_fabricante, proveedor')
      .order('nombre', { ascending: true })
    if (solicitud?.laboratorio_id) query = query.eq('laboratorio_id', solicitud.laboratorio_id)
    query.then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        console.error('Error cargando materiales:', error.message, error.code, error.details, error.hint)
        setMatError(`No se pudieron cargar los materiales guardados: ${error.message}${error.code ? ` (${error.code})` : ''}`)
        return
      }
      setCatalogoMateriales((data as MaterialCatalogo[]) || [])
    })
    return () => {
      cancelled = true
    }
  }, [solicitud?.laboratorio_id])

  // Materiales ya agregados a esta solicitud
  useEffect(() => {
    if (!solicitud?.id) {
      setMateriales([])
      return
    }
    let cancelled = false
    supabase
      .from('solicitud_materiales')
      .select(MATERIAL_ORDEN_COLUMNS)
      .eq('solicitud_id', solicitud.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Error cargando materiales de la orden:', error.message, error.code, error.details, error.hint)
          setMatError(`No se pudieron cargar los materiales de la orden: ${error.message}${error.code ? ` (${error.code})` : ''}`)
          return
        }
        setMateriales((data as MaterialOrden[]) || [])
      })
    return () => {
      cancelled = true
    }
  }, [solicitud?.id])

  async function agregarMaterial() {
    const cat = catalogoMateriales.find((m) => m.id === materialSel)
    if (!cat || !solicitud?.id || matSaving) return
    setMatSaving(true)
    setMatError(null)
    try {
      const { data, error } = await supabase
        .from('solicitud_materiales')
        .insert({
          solicitud_id: solicitud.id,
          material_id: cat.id,
          material: cat.material || cat.nombre,
          producto: cat.producto,
          numero_lote: cat.numero_lote,
          marca_fabricante: cat.marca_fabricante,
          proveedor: cat.proveedor,
        })
        .select(MATERIAL_ORDEN_COLUMNS)
        .single()
      if (error) throw error
      setMateriales((prev) => [...prev, data as MaterialOrden])
      setMaterialSel('')
    } catch (e: any) {
      console.error('Error guardando material:', e?.message, e?.code, e?.details, e?.hint)
      setMatError(`No se pudo agregar el material: ${e?.message || 'error desconocido'}${e?.code ? ` (${e.code})` : ''}`)
    } finally {
      setMatSaving(false)
    }
  }

  async function eliminarMaterial(id: string) {
    if (matDeletingId) return
    if (!confirm('¿Quitar este material de la orden?')) return
    setMatDeletingId(id)
    setMatError(null)
    try {
      const { error } = await supabase.from('solicitud_materiales').delete().eq('id', id)
      if (error) throw error
      setMateriales((prev) => prev.filter((m) => m.id !== id))
    } catch (e: any) {
      console.error('Error eliminando material:', e?.message, e?.code, e?.details, e?.hint)
      setMatError(`No se pudo quitar el material: ${e?.message || 'error desconocido'}${e?.code ? ` (${e.code})` : ''}`)
    } finally {
      setMatDeletingId(null)
    }
  }

  // Observaciones guardadas de esta solicitud
  useEffect(() => {
    if (!solicitud?.id) {
      setObs([])
      return
    }
    let cancelled = false
    setObsError(null)
    supabase
      .from('solicitud_observaciones')
      .select('id, texto, created_at')
      .eq('solicitud_id', solicitud.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Error cargando observaciones:', error.message, error.code, error.details, error.hint)
          setObsError(`No se pudieron cargar las observaciones: ${error.message}${error.code ? ` (${error.code})` : ''}`)
          return
        }
        setObs((data as Observacion[]) || [])
      })
    return () => {
      cancelled = true
    }
  }, [solicitud?.id])

  async function agregarObservacion() {
    const texto = obsText.trim()
    if (!texto || !solicitud?.id || obsSaving) return
    setObsSaving(true)
    setObsError(null)
    try {
      const { data, error } = await supabase
        .from('solicitud_observaciones')
        .insert({ solicitud_id: solicitud.id, texto })
        .select('id, texto, created_at')
        .single()
      if (error) throw error
      setObs((prev) => [...prev, data as Observacion])
      setObsText('')
    } catch (e: any) {
      console.error('Error guardando observación:', e?.message, e?.code, e?.details, e?.hint)
      setObsError(`No se pudo guardar la observación: ${e?.message || 'error desconocido'}${e?.code ? ` (${e.code})` : ''}`)
    } finally {
      setObsSaving(false)
    }
  }

  // Incidencias: solo las de esta solicitud
  useEffect(() => {
    if (!solicitud?.id) {
      setIncidencias([])
      return
    }
    let cancelled = false
    setIncidenciasLoading(true)
    setIncidenciasError(null)
    supabase
      .from('incidencias')
      .select('id, codigo, solicitud_id, tipo, fecha, hora, fase, descripcion, responsable, estado')
      .eq('solicitud_id', solicitud.id)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Error cargando incidencias:', error)
          setIncidenciasError('No se pudieron cargar las incidencias.')
          setIncidencias([])
        } else {
          setIncidencias((data as Incidencia[]) || [])
        }
        setIncidenciasLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [solicitud?.id])

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
        {matError ? <p className="mb-2 text-red-600">{matError}</p> : null}
        <div className="mb-2 flex gap-2">
          <select
            value={materialSel}
            onChange={(e) => setMaterialSel(e.target.value)}
            className="flex-1 rounded border border-border bg-card p-2 text-sm"
          >
            <option value="">
              {catalogoMateriales.length === 0 ? 'No hay materiales registrados' : 'Seleccionar material...'}
            </option>
            {catalogoMateriales
              .filter((m) => !materiales.some((x) => x.material_id === m.id))
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.codigo ? `${m.codigo} - ` : ''}
                  {m.nombre || m.material || 'Material'}
                  {m.numero_lote ? ` · Lote ${m.numero_lote}` : ''}
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={agregarMaterial}
            disabled={matSaving || !materialSel}
            className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {matSaving ? 'Agregando…' : 'Agregar'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr>
                <th className="border border-border p-1 text-left">Material</th>
                <th className="border border-border p-1 text-left">Producto</th>
                <th className="border border-border p-1 text-left">Número de lote</th>
                <th className="border border-border p-1 text-left">Fabricante</th>
                <th className="border border-border p-1 text-left">Proveedor</th>
                <th className="border border-border p-1 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materiales.map((m) => (
                <tr key={m.id} className="align-top">
                  <td className="border border-border p-1 break-words">{m.material || '—'}</td>
                  <td className="border border-border p-1 break-words">{m.producto || '—'}</td>
                  <td className="border border-border p-1">{m.numero_lote || '—'}</td>
                  <td className="border border-border p-1 break-words">{m.marca_fabricante || '—'}</td>
                  <td className="border border-border p-1 break-words">{m.proveedor || '—'}</td>
                  <td className="border border-border p-1 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => eliminarMaterial(m.id)}
                      disabled={matDeletingId === m.id}
                      className="text-xs text-red-600 underline disabled:opacity-50"
                    >
                      {matDeletingId === m.id ? 'Quitando…' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
              {materiales.length === 0 && (
                <tr>
                  <td className="border border-border p-1 text-muted-foreground" colSpan={6}>
                    Sin materiales agregados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-4">
        <h3 className="font-semibold">FASES DE FABRICACIÓN</h3>
        {avanceError ? <p className="mb-2 text-red-600">{avanceError}</p> : null}
        {fasesLoading ? (
          <p className="text-muted-foreground">Cargando fases…</p>
        ) : grupos.length === 0 ? (
          <p className="text-muted-foreground">Sin fases registradas.</p>
        ) : (
          <div className="grid gap-4">
            {grupos.map((g) => (
              <div key={g.key}>
                <p className="mb-1">
                  <span className="font-semibold">{g.titulo}</span>
                  <span className="ml-3 text-muted-foreground">Dientes: {g.dientes}</span>
                  <span className="ml-3 text-muted-foreground">Cant: {g.cantidad}</span>
                </p>
                {g.fases.length === 0 ? (
                  <p className="text-muted-foreground">Este producto no tiene fases configuradas.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border">
                      <thead>
                        <tr>
                          <th className="border border-border p-1 text-left">Tipo</th>
                          <th className="border border-border p-1 text-left">Estado</th>
                          <th className="border border-border p-1 text-left">Realizada por</th>
                          <th className="border border-border p-1 text-left">Fecha finalización</th>
                          <th className="border border-border p-1 text-left">Fecha prueba</th>
                          <th className="border border-border p-1 text-left">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.fases.map((f) => {
                          const r = registros[f.id] ?? REGISTRO_VACIO
                          const modificado = estaModificado(f.id)
                          const empleadoExtra =
                            r.realizado_por && !empleados.some((e) => e.nombre === r.realizado_por)
                              ? r.realizado_por
                              : null
                          return (
                            <tr key={f.id} className="align-middle">
                              <td className="border border-border p-1 font-medium uppercase">{f.nombre}</td>
                              <td className="border border-border p-1">
                                <select
                                  value={r.estado}
                                  onChange={(e) => setCampo(f.id, 'estado', e.target.value)}
                                  className={`${INPUT_CLASS} ${
                                    r.estado === 'completado' ? 'bg-green-100 text-green-800' : ''
                                  }`}
                                >
                                  {ESTADO_FASE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="border border-border p-1">
                                <select
                                  value={r.realizado_por}
                                  onChange={(e) => setCampo(f.id, 'realizado_por', e.target.value)}
                                  className={INPUT_CLASS}
                                >
                                  <option value="">Seleccionar empleado</option>
                                  {empleadoExtra && <option value={empleadoExtra}>{empleadoExtra}</option>}
                                  {empleados.map((e) => (
                                    <option key={e.id} value={e.nombre}>{e.nombre}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="border border-border p-1">
                                <input
                                  type="date"
                                  value={r.fecha_finalizacion}
                                  onChange={(e) => setCampo(f.id, 'fecha_finalizacion', e.target.value)}
                                  className={INPUT_CLASS}
                                />
                              </td>
                              <td className="border border-border p-1">
                                <input
                                  type="date"
                                  value={r.fecha_prueba}
                                  onChange={(e) => setCampo(f.id, 'fecha_prueba', e.target.value)}
                                  className={INPUT_CLASS}
                                />
                              </td>
                              <td className="border border-border p-1 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => guardarFase(f.id)}
                                  disabled={!modificado || guardandoId === f.id}
                                  className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50"
                                >
                                  {guardandoId === f.id ? 'Guardando…' : 'Guardar'}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-4">
        <h3 className="font-semibold">INCIDENCIAS</h3>
        {incidenciasLoading ? (
          <p className="text-muted-foreground">Cargando incidencias…</p>
        ) : incidenciasError ? (
          <p className="text-red-600">{incidenciasError}</p>
        ) : incidencias.length === 0 ? (
          <p className="text-muted-foreground">Sin incidencias registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr>
                  <th className="border border-border p-1 text-left">Código</th>
                  <th className="border border-border p-1 text-left">Fecha</th>
                  <th className="border border-border p-1 text-left">Hora</th>
                  <th className="border border-border p-1 text-left">Tipo</th>
                  <th className="border border-border p-1 text-left">Fase</th>
                  <th className="border border-border p-1 text-left">Registrado por</th>
                  <th className="border border-border p-1 text-left">Descripción</th>
                  <th className="border border-border p-1 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {incidencias.map((inc) => (
                  <tr key={inc.id} className="align-top">
                    <td className="border border-border p-1 font-mono text-xs whitespace-nowrap">
                      {inc.codigo || '—'}
                    </td>
                    <td className="border border-border p-1 whitespace-nowrap">{formatFecha(inc.fecha)}</td>
                    <td className="border border-border p-1 whitespace-nowrap">{formatHora(inc.hora)}</td>
                    <td className="border border-border p-1">{capitalize(inc.tipo)}</td>
                    <td className="border border-border p-1">{capitalize(inc.fase)}</td>
                    <td className="border border-border p-1">{inc.responsable || '—'}</td>
                    <td className="border border-border p-1 break-words whitespace-pre-wrap">
                      {inc.descripcion || '—'}
                    </td>
                    <td className="border border-border p-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          INCIDENCIA_ESTADO_CLASS[inc.estado || ''] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {capitalize(inc.estado)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-4">
        <h3 className="font-semibold">OBSERVACIONES</h3>
        {obsError ? <p className="mb-2 text-red-600">{obsError}</p> : null}
        <div className="mb-2 flex gap-2">
          <input
            value={obsText}
            onChange={(e) => setObsText(e.target.value)}
            placeholder="Escribir observación..."
            className="flex-1 rounded border border-border bg-card p-2 text-sm"
          />
          <button
            type="button"
            onClick={agregarObservacion}
            disabled={obsSaving || !obsText.trim()}
            className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {obsSaving ? 'Guardando…' : 'Agregar'}
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
            {obs.map((o) => (
              <tr key={o.id} className="align-top">
                <td className="border border-border p-1 whitespace-nowrap">
                  {new Date(o.created_at).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </td>
                <td className="border border-border p-1 break-words whitespace-pre-wrap">{o.texto}</td>
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
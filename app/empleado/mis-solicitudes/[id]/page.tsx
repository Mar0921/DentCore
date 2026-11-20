'use client'

import { Fragment, useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DentalChart } from '@/components/dentcore/solicitud/dental-chart'
import { FasesFabricacion } from '@/components/dentcore/laboratorio/fases-fabricacion'
import { FichaTecnicaColadoUcla } from '@/components/dentcore/fichas-tecnicas/ficha-tecnica-colado-ucla'
import { FichaTecnicaCeramicaEncia } from '@/components/dentcore/fichas-tecnicas/ficha-tecnica-ceramica-encia'
import { FichaTecnicaGenerica } from '@/components/dentcore/fichas-tecnicas/ficha-tecnica-generica'
import { ChevronLeft, RefreshCw, Save, X, Eye, FileText, Image, Upload } from 'lucide-react'
import { AppShell } from '@/components/dentcore/app-shell'
import type { ToothStatus } from '@/components/dentcore/solicitud/solicitud-types'

const GARANTIA_VIEWER_URL = (solicitudId: string) => `/api/garantia?solicitud_id=${encodeURIComponent(solicitudId)}`

const EXT_IMAGEN = /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?|#|$)/i
const REGEX_URL = /^(https?:|data:|blob:|\/)/i

/** Acepta: array, string JSON, literal de Postgres {a,b}, string suelto u objeto. */
function normalizarArchivos(valor: unknown): unknown[] {
  if (!valor) return []
  if (Array.isArray(valor)) return valor
  if (typeof valor === 'string') {
    const t = valor.trim()
    if (!t) return []
    if (t.startsWith('[') || t.startsWith('{"')) {
      try {
        const p = JSON.parse(t)
        return Array.isArray(p) ? p : [p]
      } catch {
        /* sigue */
      }
    }
    if (t.startsWith('{') && t.endsWith('}')) {
      return t
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^"|"$/g, ''))
        .filter(Boolean)
    }
    return [t]
  }
  if (typeof valor === 'object') return [valor]
  return []
}

interface AdjuntoInfo {
  nombre: string
  href: string | null
  ruta: string | null
  esImagen: boolean
}

/**
 * Formatos soportados de cada elemento:
 *  - "nombre|url"  - "url"  - "ruta/en/bucket.png"  - "data:image/png;base64,..."
 *  - { nombre | name, url | href | path }
 */
function parseAdjunto(archivo: unknown, idx: number): AdjuntoInfo {
  let nombre = ''
  let valor = ''

  if (archivo && typeof archivo === 'object') {
    const a = archivo as Record<string, any>
    nombre = String(a.nombre ?? a.name ?? a.filename ?? '').trim()
    valor = String(a.url ?? a.href ?? a.publicUrl ?? a.path ?? a.ruta ?? '').trim()
  } else {
    const raw = String(archivo ?? '').trim()
    const pipe = raw.indexOf('|')
    if (pipe > -1) {
      nombre = raw.slice(0, pipe).trim()
      valor = raw.slice(pipe + 1).trim()
    } else {
      valor = raw
    }
  }

  const esUrl = REGEX_URL.test(valor)

  if (!nombre && valor && !/^data:/i.test(valor)) {
    try {
      nombre = decodeURIComponent(new URL(valor, 'http://x').pathname.split('/').pop() || '')
    } catch {
      nombre = valor.split('/').pop() || valor
    }
  }
  if (!nombre) nombre = `Archivo ${idx + 1}`

  const esImagen = /^data:image\//i.test(valor) || EXT_IMAGEN.test(nombre) || EXT_IMAGEN.test(valor)

  return {
    nombre,
    href: esUrl ? valor : null,
    ruta: !esUrl && valor ? valor.replace(/^\/+/, '') : null,
    esImagen,
  }
}

function isViewableDocument(nombreArchivo?: string | null, tipoMime?: string | null) {
  if (!nombreArchivo && !tipoMime) return false
  const source = `${nombreArchivo || ''} ${tipoMime || ''}`.toLowerCase()
  return /\.(pdf|jpg|jpeg|png|gif|webp|svg)$/.test(source) || source.includes('pdf') || source.includes('image/')
}

/**
 * Abre una ventana de impresión con SOLO el contenido del elemento indicado,
 * copiando los estilos de la página (Tailwind, variables CSS, etc.).
 * Desde el diálogo de impresión se elige "Guardar como PDF".
 */
function imprimirElemento(el: HTMLElement | null, titulo: string) {
  if (!el) return
  const win = window.open('', '_blank', 'width=900,height=1000')
  if (!win) {
    alert('El navegador bloqueó la ventana emergente. Permita las ventanas emergentes para descargar el PDF.')
    return
  }

  const estilos = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((n) => n.outerHTML)
    .join('\n')

  win.document.open()
  win.document.write(`<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${titulo}</title>
    ${estilos}
    <style>
      @page { size: A4; margin: 12mm; }
      html, body { background: #fff !important; color: #111 !important; }
      body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .print-root { width: 100%; max-width: 190mm; margin: 0 auto; }
      .no-break { break-inside: avoid; page-break-inside: avoid; }
    </style>
  </head>
  <body>
    <div class="print-root">${el.innerHTML}</div>
  </body>
</html>`)
  win.document.close()

  const lanzar = () => {
    win.focus()
    win.print()
  }
  // Esperar a que carguen estilos e imágenes
  if (win.document.readyState === 'complete') {
    setTimeout(lanzar, 600)
  } else {
    win.onload = () => setTimeout(lanzar, 600)
  }
}

interface FaseLite {
  id: string
  nombre: string
  orden: number
}

interface CampoFicha {
  label: string
  value: string
}

interface SeccionFicha {
  titulo: string
  campos: CampoFicha[]
}

interface FichaRegistro {
  id: string
  nombre?: string | null
  tipo?: string | null
  fecha?: string | null
  secciones?: SeccionFicha[] | null
  nombre_archivo?: string | null
  archivo_url?: string | null
  tipo_mime?: string | null
  created_at?: string | null
}

interface LaboratorioInfo {
  nombre: string
  nit: string
  direccion: string
  ciudad: string
  telefono: string
  correo: string
}

interface ProductoFaseRow {
  id: string
  producto_id: string
  fase_id: string
  orden: number | null
}

interface SolicitudLite {
  id: string
  tipo: string | null
  estado: string | null
  prioridad: string | null
  progreso: number | null
  asignado_a: string | null
  notas: string | null
  odontologonombre: string | null
  odontologo_email: string | null
  odontologo_telefono: string | null
  dientes: string | null
  paciente: string | null
  cc_paciente: string | null
  fecha_entrega: string | null
  firma_odontologo: string | null
  fase_id: string | null
  laboratorio_id: string | null
  created_at: string
  updated_at: string
  registro_medico: string | null
  historia_clinica: string | null
  indicaciones: string | null
  color: string | null
  guia: string | null
  codigo_trazabilidad: string | null
  productos: string | null
  piezas_enviadas: string | null
  archivos: string[] | null
}

const ESTADO_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completada', label: 'Completada' },
  { value: 'entregada', label: 'Entregada' },
  { value: 'cancelada', label: 'Cancelada' },
] as const

// Estados válidos para una FASE de fabricación (en la BD se guarda "completado")
const ESTADO_FASE_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completado', label: 'Completado' },
] as const

const PRIORIDAD_OPTIONS = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
] as const

/** Normaliza el estado de una fase tal como viene de la BD ("completada" -> "completado"). */
function normalizeEstadoFase(value?: string | null): string {
  const s = (value || 'pendiente').toString().toLowerCase().trim()
  return s === 'completada' ? 'completado' : s
}

function isFaseCompletada(value?: string | null): boolean {
  return normalizeEstadoFase(value) === 'completado'
}

function parseDientes(dientes?: string | null): number[] {
  if (!dientes) return []
  return Array.from(
    new Set(
      dientes
        .split(/[\s,]+/)
        .map((t) => parseInt(t, 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 48),
    ),
  ).sort((a, b) => a - b)
}

function formatFecha(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? value : d.toLocaleDateString('es-ES')
}

function tieneSecciones(ficha: FichaRegistro) {
  return Array.isArray(ficha.secciones) && ficha.secciones.length > 0
}

function nombreArchivoAdjunto(archivo: string) {
  const parts = archivo.split('|')
  return parts[0]?.trim() || archivo
}

export default function EmpleadoSolicitudDetallePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [solicitud, setSolicitud] = useState<SolicitudLite | null>(null)
  const [fases, setFases] = useState<FaseLite[]>([])
  const [loading, setLoading] = useState(true)
  const [productoIds, setProductoIds] = useState<string[]>([])

  const SELECT_CLASS =
    "h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
  const [isEditingFase, setIsEditingFase] = useState(false)
  const [selectedFaseId, setSelectedFaseId] = useState<string | null>(null)
  const [savingFase, setSavingFase] = useState(false)
  const [encuestas, setEncuestas] = useState<{
    posAdaptacion: any | null
    buzon: any | null
  }>({ posAdaptacion: null, buzon: null })
  const [garantia, setGarantia] = useState<any | null>(null)
  const [observaciones, setObservaciones] = useState<any[]>([])
  const [nuevaObservacion, setNuevaObservacion] = useState('')
  const [guardandoObservacion, setGuardandoObservacion] = useState(false)
  const [catalogoMateriales, setCatalogoMateriales] = useState<any[]>([])
  const [materialesSolicitud, setMaterialesSolicitud] = useState<any[]>([])
  const [materialSel, setMaterialSel] = useState('')
  const [guardandoMaterial, setGuardandoMaterial] = useState(false)
  const [eliminandoMaterialId, setEliminandoMaterialId] = useState<string | null>(null)
  const [fichas, setFichas] = useState<FichaRegistro[]>([])
  // Filas que ya existen en solicitud_fases para esta solicitud
  const [solicitudFases, setSolicitudFases] = useState<any[]>([])
  // producto_fase_id -> fase_id (para las filas existentes)
  const [productoFaseMap, setProductoFaseMap] = useState<Map<string, string>>(new Map())
  // producto_fase_id -> { producto_id, fase_id } (para las filas existentes)
  const [pfInfo, setPfInfo] = useState<Map<string, { producto_id: string; fase_id: string }>>(new Map())
  // TODAS las fases definidas en producto_fases para los productos de esta solicitud
  const [catalogoFases, setCatalogoFases] = useState<ProductoFaseRow[]>([])
  // producto_id -> título
  const [productoTituloMap, setProductoTituloMap] = useState<Map<string, string>>(new Map())
  const [incidencias, setIncidencias] = useState<any[]>([])
  const [medidasPorInc, setMedidasPorInc] = useState<Record<string, any[]>>({})
  const [fichaVista, setFichaVista] = useState<FichaRegistro | null>(null)
  const [laboratorio, setLaboratorio] = useState<LaboratorioInfo | null>(null)
  const [empleadoActual, setEmpleadoActual] = useState<string>('')

  // Ref para exportar la preescripción a PDF
  const preescripcionRef = useRef<HTMLDivElement>(null)

  // Estados para subir evidencia de fase (solo cuando se marca como COMPLETADO)
  const [openEvidenceDialog, setOpenEvidenceDialog] = useState(false)
  const [faseParaEvidencia, setFaseParaEvidencia] = useState<any | null>(null)
  const [evidenciaFile, setEvidenciaFile] = useState<File | null>(null)
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false)
  const [savingFaseFilaId, setSavingFaseFilaId] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  // Solo se editan el estado y la fecha de finalización. La fecha de prueba NUNCA es editable.
  const [faseEdits, setFaseEdits] = useState<Record<string, { estado: string; fechaFinalizacion: string }>>({})

  // Filas que se muestran en la tabla: TODAS las fases de producto_fases,
  // combinadas con lo que ya exista en solicitud_fases (si no existe, se muestra "pendiente").
  const filasFases = useMemo(() => {
    const rows: any[] = []
    const usados = new Set<string>()
    const tituloDe = (pid?: string | null) => (pid && productoTituloMap.get(pid)) || 'Producto'

    const construir = (
      pfId: string | null,
      sfRow: any | null,
      productoId: string | null | undefined,
      faseIdCatalogo: string | null | undefined,
      ordenCatalogo: number | null | undefined,
    ) => {
      const faseId = sfRow?.fase_id || faseIdCatalogo || null
      const faseInfo = fases.find((f) => f.id === faseId)
      const base = sfRow || {
        id: `virtual-${pfId}`,
        solicitud_id: solicitud?.id,
        estado: 'pendiente',
        fecha_finalizacion: null,
        fecha_prueba: null,
        realizado_por: null,
      }
      return {
        ...base,
        producto_fase_id: pfId,
        virtual: !sfRow,
        faseId,
        nombreFase: faseInfo?.nombre || 'Fase',
        orden: ordenCatalogo ?? faseInfo?.orden ?? 999,
        nombreProducto: tituloDe(productoId),
      }
    }

    catalogoFases.forEach((pf) => {
      const sf = solicitudFases.find((x: any) => x.producto_fase_id === pf.id) || null
      usados.add(pf.id)
      rows.push(construir(pf.id, sf, pf.producto_id, pf.fase_id, pf.orden))
    })

    // Filas de solicitud_fases cuyo producto_fase no apareció en el catálogo
    solicitudFases.forEach((sf: any) => {
      if (sf.producto_fase_id && usados.has(sf.producto_fase_id)) return
      const info = pfInfo.get(sf.producto_fase_id)
      rows.push(construir(sf.producto_fase_id ?? null, sf, info?.producto_id, info?.fase_id, null))
    })

    return rows
  }, [catalogoFases, solicitudFases, pfInfo, fases, productoTituloMap, solicitud?.id])

  // Inicializa las ediciones con lo que hay en la BD
  useEffect(() => {
    const next: Record<string, { estado: string; fechaFinalizacion: string }> = {}
    filasFases.forEach((f: any) => {
      next[f.id] = {
        estado: normalizeEstadoFase(f.estado),
        fechaFinalizacion: f.fecha_finalizacion || '',
      }
    })
    setFaseEdits(next)
  }, [filasFases])

  // Cámara para "Tomar foto"
  useEffect(() => {
    if (!cameraOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch {
        alert('No se pudo acceder a la cámara. Revise los permisos del navegador.')
        setCameraOpen(false)
      }
    })()
    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [cameraOpen])

  useEffect(() => {
    if (!id) return
    const fetchSolicitud = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/solicitudes?id=${id}&empleado=true`)
        const result = await res.json()
        setSolicitud(result?.data || null)
      } catch {
        setSolicitud(null)
      } finally {
        setLoading(false)
      }
    }
    fetchSolicitud()
  }, [id])

  useEffect(() => {
    if (!solicitud?.laboratorio_id) return
    let cancelled = false
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: emp } = await supabase
            .from('empleados')
            .select('nombre')
            .eq('email', user.email || '')
            .eq('laboratorio_id', solicitud.laboratorio_id)
            .maybeSingle()
          if (emp && !cancelled) setEmpleadoActual((emp as any).nombre || '')
        }
      } catch (e) {
        console.error('Error cargando empleado actual:', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [solicitud?.laboratorio_id])

  useEffect(() => {
    if (solicitud) {
      loadFases()
    }
  }, [solicitud])

  async function loadFases() {
    if (!solicitud?.id) return
    try {
      // 1) Catálogo de fases (nombre/orden)
      let { data, error } = await supabase
        .from('fases')
        .select('id, nombre, orden')
        .order('orden', { ascending: true })

      if ((!data || data.length === 0) && solicitud?.laboratorio_id) {
        const retry = await supabase
          .from('fases')
          .select('id, nombre, orden')
          .eq('laboratorio_id', solicitud.laboratorio_id)
          .order('orden', { ascending: true })
        ;({ data, error } = retry)
      }

      if (!error && data && data.length > 0) {
        setFases(data as FaseLite[])
      }

      // 2) Filas existentes de solicitud_fases (independiente de lo anterior)
      const { data: sf, error: sfError } = await supabase
        .from('solicitud_fases')
        .select('*')
        .eq('solicitud_id', solicitud.id)
        .order('updated_at', { ascending: false })
      if (sfError) console.error('Error leyendo solicitud_fases:', sfError)
      setSolicitudFases(sf || [])

      // 3) Info de producto_fases de esas filas
      const ids = (sf || []).map((x: any) => x.producto_fase_id).filter(Boolean)
      if (ids.length) {
        const { data: pf } = await supabase
          .from('producto_fases')
          .select('id, producto_id, fase_id')
          .in('id', ids)
        const pfRows = pf || []
        setProductoFaseMap(new Map(pfRows.map((x: any) => [x.id, x.fase_id])))
        setPfInfo(
          new Map(pfRows.map((x: any) => [x.id, { producto_id: x.producto_id, fase_id: x.fase_id }])),
        )
      } else {
        setProductoFaseMap(new Map())
        setPfInfo(new Map())
      }
    } catch (e) {
      console.error('Error en loadFases:', e)
    }
  }

  // Carga TODAS las fases de producto_fases para los productos de la solicitud
  useEffect(() => {
    if (!solicitud?.id) return
    let cancelled = false
    ;(async () => {
      try {
        const prodIds = new Set<string>(productoIds)
        pfInfo.forEach((v) => {
          if (v.producto_id) prodIds.add(v.producto_id)
        })
        if (prodIds.size === 0) {
          if (!cancelled) setCatalogoFases([])
          return
        }
        const arr = Array.from(prodIds)
        const { data: pf, error: pfErr } = await supabase
          .from('producto_fases')
          .select('id, producto_id, fase_id, orden')
          .in('producto_id', arr)
          .order('orden', { ascending: true })
        if (pfErr) console.error('Error leyendo producto_fases:', pfErr)

        const { data: prods } = await supabase
          .from('productos')
          .select('id, titulo, nombre')
          .in('id', arr)

        if (cancelled) return
        setCatalogoFases((pf || []) as ProductoFaseRow[])
        setProductoTituloMap(
          new Map((prods || []).map((x: any) => [x.id, x.titulo || x.nombre || 'Producto'])),
        )
      } catch (e) {
        console.error('Error cargando catálogo de fases:', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [solicitud?.id, productoIds, pfInfo])

  // Datos del laboratorio (para el encabezado de la preescripción)
  // SUPOSICIÓN: tabla "laboratorios" con columnas nombre, nit, direccion, ciudad, telefono, correo/email.
  // NOTA: el empleado debe tener permiso (RLS) de lectura sobre "laboratorios".
  useEffect(() => {
    if (!solicitud?.laboratorio_id) return
    const laboratorioId = solicitud.laboratorio_id

    async function loadLaboratorio() {
      try {
        const { data, error } = await supabase
          .from('laboratorios')
          .select('*')
          .eq('id', laboratorioId)
          .maybeSingle()

        if (error || !data) return
        const d = data as Record<string, any>
        setLaboratorio({
          nombre: d.nombre ?? d.razon_social ?? d.name ?? '',
          nit: d.nit ?? d.documento ?? '',
          direccion: d.direccion ?? d.address ?? '',
          ciudad: d.ciudad ?? d.city ?? '',
          telefono: d.telefono ?? d.celular ?? d.phone ?? '',
          correo: d.correo ?? d.email ?? d.correo_electronico ?? '',
        })
      } catch {
        // ignore
      }
    }
    loadLaboratorio()
  }, [solicitud?.laboratorio_id])

  useEffect(() => {
    if (!solicitud?.laboratorio_id || !solicitud.tipo || !solicitud.productos) {
      setProductoIds([])
      return
    }
    const laboratorioId = solicitud.laboratorio_id
    async function resolveProductoIds() {
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('id, titulo, nombre')
          .eq('laboratorio_id', laboratorioId)
        if (error || !data) {
          setProductoIds([])
          return
        }
        const solProd = String(solicitud!.productos).toLowerCase()
        const normSol = solProd.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        const ids = data
          .filter((p: any) => {
            const t = (p.titulo || p.nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            return t && (normSol.includes(t) || t.includes(normSol))
          })
          .map((p: any) => p.id)
        setProductoIds(ids)
      } catch {
        setProductoIds([])
      }
    }
    resolveProductoIds()
  }, [solicitud?.laboratorio_id, solicitud?.productos])

  useEffect(() => {
    if (!solicitud) return

    async function loadEncuestas() {
      try {
        const res = await fetch(`/api/encuestas?solicitud_id=${encodeURIComponent(solicitud!.id)}`)
        if (!res.ok) {
          console.error('Error fetching encuestas:', await res.text())
          return
        }
        const result = await res.json()
        setEncuestas({
          posAdaptacion: result.posAdaptacion || null,
          buzon: result.buzon || null,
        })
      } catch (e) {
        console.error('Error loading encuestas:', e)
      }
    }

    loadEncuestas()
  }, [solicitud])

  useEffect(() => {
    if (!solicitud) {
      setFichas([])
      return
    }
    let cancelled = false
    async function loadFichas() {
      try {
        const res = await fetch(`/api/fichas-tecnicas?solicitud_id=${encodeURIComponent(solicitud!.id)}`)
        if (!res.ok) {
          console.error('Error fetching fichas tecnicas:', await res.text())
          return
        }
        const result = await res.json()
        if (!cancelled) setFichas(result.data || [])
      } catch (e) {
        console.error('Error loading fichas tecnicas:', e)
      }
    }
    loadFichas()
    return () => {
      cancelled = true
    }
  }, [solicitud])

  // Cerrar el modal de ficha con Escape
  useEffect(() => {
    if (!fichaVista) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFichaVista(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fichaVista])

  useEffect(() => {
    if (!solicitud) {
      setObservaciones([])
      return
    }
    let cancelled = false
    async function loadObservaciones() {
      try {
        const res = await fetch(`/api/solicitud-observaciones?solicitud_id=${encodeURIComponent(solicitud!.id)}`)
        if (res.ok) {
          const result = await res.json()
          if (!cancelled && Array.isArray(result?.data)) {
            setObservaciones(result.data)
            return
          }
        }
      } catch (e) {
        console.error('Error loading observaciones:', e)
      }
      // Fallback directo a Supabase
      if (!cancelled) {
        supabase
          .from('solicitud_observaciones')
          .select('id, texto, created_at')
          .eq('solicitud_id', solicitud!.id)
          .order('created_at', { ascending: true })
          .then(({ data, error }) => {
            if (cancelled) return
            if (!error && data) {
              setObservaciones(data)
            }
          })
      }
    }

    loadObservaciones()
    return () => {
      cancelled = true
    }
  }, [solicitud])

  useEffect(() => {
    if (!solicitud?.laboratorio_id) {
      setCatalogoMateriales([])
      return
    }
    let cancelled = false
    supabase
      .from('materiales')
      .select('id, codigo, nombre, material, producto, numero_lote, marca_fabricante, proveedor')
      .eq('laboratorio_id', solicitud.laboratorio_id)
      .order('nombre')
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) {
          setCatalogoMateriales(data)
        } else {
          setCatalogoMateriales([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [solicitud?.laboratorio_id])

  useEffect(() => {
    if (!solicitud) {
      setMaterialesSolicitud([])
      return
    }
    let cancelled = false
    supabase
      .from('solicitud_materiales')
      .select('id, material_id, material, producto, numero_lote, marca_fabricante, proveedor')
      .eq('solicitud_id', solicitud.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) {
          setMaterialesSolicitud(data)
        } else {
          setMaterialesSolicitud([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [solicitud])

  async function handleAgregarMaterial() {
    const cat = catalogoMateriales.find((m) => m.id === materialSel)
    if (!cat || !solicitud?.id || guardandoMaterial) return
    setGuardandoMaterial(true)
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
        .select('id, material_id, material, producto, numero_lote, marca_fabricante, proveedor')
        .single()
      if (error) throw error
      setMaterialesSolicitud((prev) => [...prev, data])
      setMaterialSel('')
    } catch (e: any) {
      alert('Error al agregar material: ' + (e?.message || 'desconocido'))
    } finally {
      setGuardandoMaterial(false)
    }
  }

  async function handleEliminarMaterial(id: string) {
    if (eliminandoMaterialId) return
    if (!confirm('¿Quitar este material de la solicitud?')) return
    setEliminandoMaterialId(id)
    try {
      const { error } = await supabase.from('solicitud_materiales').delete().eq('id', id)
      if (error) throw error
      setMaterialesSolicitud((prev) => prev.filter((m) => m.id !== id))
    } catch (e: any) {
      alert('Error al quitar material: ' + (e?.message || 'desconocido'))
    } finally {
      setEliminandoMaterialId(null)
    }
  }

  async function handleAgregarObservacion() {
    if (!solicitud || guardandoObservacion) return
    const texto = nuevaObservacion.trim()
    if (!texto) return
    setGuardandoObservacion(true)
    try {
      // Try API first
      const res = await fetch('/api/solicitud-observaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitud_id: solicitud.id,
          texto,
        }),
      })
      if (res.ok) {
        const result = await res.json()
        if (result?.data) {
          setObservaciones((prev) => [...prev, result.data])
          setNuevaObservacion('')
          setGuardandoObservacion(false)
          return
        }
      }
      // Fallback directo a Supabase
      const { data, error } = await supabase
        .from('solicitud_observaciones')
        .insert({ solicitud_id: solicitud!.id, texto })
        .select('id, texto, created_at')
        .single()
      if (error) throw error
      setObservaciones((prev) => [...prev, data])
      setNuevaObservacion('')
    } catch (e: any) {
      alert('Error al agregar observación: ' + e.message)
    } finally {
      setGuardandoObservacion(false)
    }
  }

  useEffect(() => {
    if (!solicitud) {
      setIncidencias([])
      return
    }
    let cancelled = false
    supabase
      .from('incidencias')
      .select('*')
      .eq('solicitud_id', solicitud.id)
      .order('fecha_creacion', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setIncidencias(data)
      })
    return () => {
      cancelled = true
    }
  }, [solicitud])

  const selectedTeeth = useMemo(() => parseDientes(solicitud?.dientes), [solicitud?.dientes])

  const adjuntos = useMemo(() => normalizarArchivos(solicitud?.archivos).map((a, i) => parseAdjunto(a, i)), [solicitud?.archivos])

  const estadoOpt = ESTADO_OPTIONS.find((e) => e.value === solicitud?.estado)
  const prioridadOpt = PRIORIDAD_OPTIONS.find((p) => p.value === solicitud?.prioridad)
  const faseSeleccionada = useMemo(() => {
    if (isEditingFase && selectedFaseId) {
      return fases.find((f) => f.id === selectedFaseId)
    }
    const lastRow = solicitudFases[0]
    if (lastRow) {
      const fid = lastRow.fase_id || (lastRow.producto_fase_id ? productoFaseMap.get(lastRow.producto_fase_id) || null : null)
      if (fid) return fases.find((f) => f.id === fid)
    }
    return fases.find((f) => f.id === solicitud?.fase_id) ?? fases[fases.length - 1] ?? undefined
  }, [isEditingFase, selectedFaseId, solicitudFases, productoFaseMap, fases, solicitud?.fase_id])

  const progresoDerivado = useMemo(() => {
    // Progreso = fases completadas / total de fases definidas en producto_fases
    if (filasFases.length > 0) {
      const completadas = filasFases.filter((sf: any) => isFaseCompletada(sf.estado)).length
      return Math.round((completadas / filasFases.length) * 100)
    }
    if (!solicitud) return 0
    const fase = faseSeleccionada
    if (fase && fases.length > 0) {
      const maxOrden = Math.max(...fases.map((f) => f.orden))
      return Math.round((fase.orden / maxOrden) * 100)
    }
    return solicitud.progreso ?? 0
  }, [faseSeleccionada, solicitud, fases, filasFases])

  async function handleSaveFase() {
    if (!solicitud || savingFase) return
    if (selectedFaseId === (faseSeleccionada?.id || null)) {
      setIsEditingFase(false)
      return
    }
    setSavingFase(true)
    try {
      const res = await fetch('/api/solicitudes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: solicitud.id,
          fase_id: selectedFaseId || null,
          progreso: progresoDerivado,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Error al guardar la fase')
      setSolicitud((prev) => (prev ? { ...prev, fase_id: selectedFaseId ?? null, progreso: progresoDerivado } : prev))
      setIsEditingFase(false)
    } catch (e: any) {
      alert('Error al guardar la fase: ' + e.message)
    } finally {
      setSavingFase(false)
    }
  }

  useEffect(() => {
    if (isEditingFase && !selectedFaseId && faseSeleccionada) {
      setSelectedFaseId(faseSeleccionada.id)
    }
  }, [isEditingFase, selectedFaseId, faseSeleccionada])

  function handleCancelFase() {
    setIsEditingFase(false)
  }

  const toYMD = (value?: string | null): string => {
    if (!value) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  /**
   * Guarda la fase directamente en Supabase VERIFICANDO que realmente se escribió
   * (Supabase no da error cuando RLS bloquea un update: devuelve 0 filas).
   * Lanza error si no se pudo.
   */
  async function persistirDirecto(
    fase: any,
    sfData: Record<string, any>,
    evMeta: Record<string, any> | null,
  ) {
    if (!solicitud?.id) throw new Error('Solicitud no cargada')

    if (!fase.virtual) {
      const { data, error } = await supabase
        .from('solicitud_fases')
        .update(sfData)
        .eq('id', fase.id)
        .select('id')
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error('La base de datos no actualizó ninguna fila (posible bloqueo por RLS).')
      }
    } else {
      const { data, error } = await supabase
        .from('solicitud_fases')
        .insert({
          solicitud_id: solicitud.id,
          producto_fase_id: fase.producto_fase_id,
          ...sfData,
        })
        .select('id')
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error('La base de datos no insertó la fase (posible bloqueo por RLS).')
      }
    }

    if (evMeta) {
      const { data: existingEv, error: findEvErr } = await supabase
        .from('fases_evidencias')
        .select('id')
        .eq('solicitud_id', solicitud.id)
        .eq('producto_fase_id', fase.producto_fase_id)
        .maybeSingle()
      if (findEvErr) throw findEvErr

      if (existingEv) {
        const { data, error } = await supabase
          .from('fases_evidencias')
          .update({ ...evMeta, creado_en: new Date().toISOString() })
          .eq('id', existingEv.id)
          .select('id')
        if (error) throw error
        if (!data || data.length === 0) throw new Error('No se actualizó la evidencia (posible bloqueo por RLS).')
      } else {
        const { data, error } = await supabase
          .from('fases_evidencias')
          .insert({
            solicitud_id: solicitud.id,
            producto_fase_id: fase.producto_fase_id,
            fase_id: fase.faseId,
            laboratorio_id: solicitud.laboratorio_id,
            ...evMeta,
          })
          .select('id')
        if (error) throw error
        if (!data || data.length === 0) throw new Error('No se guardó la evidencia (posible bloqueo por RLS).')
      }
    }
  }

  /**
   * Respaldo: guarda mediante la API del servidor (/api/solicitud-fases),
   * que usa la service role y por lo tanto no depende de RLS.
   */
  async function persistirPorApi(
    fase: any,
    sfData: Record<string, any>,
    evMeta: Record<string, any> | null,
    errorDirecto: any,
  ) {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    let res: Response
    try {
      res = await fetch('/api/solicitud-fases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          solicitud_id: solicitud!.id,
          producto_fase_id: fase.producto_fase_id,
          fase_id: fase.faseId,
          ...sfData,
          evidencia: evMeta,
        }),
      })
    } catch (e: any) {
      throw new Error(`${errorDirecto?.message || 'Error al guardar'} / API: ${e?.message || 'sin conexión'}`)
    }
    if (!res.ok) {
      let detalle = `HTTP ${res.status}`
      try {
        const j = await res.json()
        detalle = j?.error || detalle
      } catch {
        // ignore
      }
      throw new Error(`${errorDirecto?.message || 'Error al guardar'} / API: ${detalle}`)
    }
  }

  /**
   * Guarda una fase.
   * - `evidencia` solo viene cuando el nuevo estado es COMPLETADO.
   * - La fecha de prueba NO se toca nunca.
   * Devuelve true si se guardó correctamente.
   */
  async function handleSaveFaseFila(fase: any, evidencia: File | null): Promise<boolean> {
    if (!solicitud?.id || !solicitud.laboratorio_id) return false
    setSavingFaseFilaId(fase.id)
    try {
      const completando = isFaseCompletada(fase.estado)
      const enProgreso = fase.estado === 'en_progreso'

      if (completando && !evidencia) {
        throw new Error('Para completar la fase debe adjuntar una evidencia.')
      }

      let empleadoId: string | null = null
      let empleadoNombre: string | null = null
      let evMeta: Record<string, any> | null = null

      if (completando || enProgreso) {
        // Usar el empleado actual ya cargado en la sesión, o cargarlo si no está
        if (!empleadoActual) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: emp } = await supabase
              .from('empleados')
              .select('id, nombre')
              .eq('email', user.email || '')
              .eq('laboratorio_id', solicitud.laboratorio_id)
              .maybeSingle()
            if (emp) {
              empleadoId = (emp as any).id || null
              empleadoNombre = (emp as any).nombre || ''
              setEmpleadoActual(empleadoNombre as string)
            }
          }
        } else {
          // Si ya tenemos el nombre, necesitamos el ID - cargarlo
          if (!empleadoId) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const { data: emp } = await supabase
                .from('empleados')
                .select('id')
                .eq('email', user.email || '')
                .eq('laboratorio_id', solicitud.laboratorio_id)
                .maybeSingle()
              if (emp) empleadoId = (emp as any).id || null
            }
          }
          empleadoNombre = empleadoActual
        }

        if (completando && evidencia) {
          const bytes = await evidencia.arrayBuffer()
          const fileBuffer = new Uint8Array(bytes)
          const filePath = `fases-evidencias/${solicitud.laboratorio_id}/${solicitud.id}/${Date.now()}_${evidencia.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`
          const { error: uploadError } = await supabase.storage
            .from('fases-evidencias')
            .upload(filePath, fileBuffer, { contentType: evidencia.type, upsert: true })
          if (uploadError) throw new Error('Error al subir la evidencia: ' + uploadError.message)
          const { data: publicUrlData } = supabase.storage.from('fases-evidencias').getPublicUrl(filePath)
          evMeta = {
            empleado_id: empleadoId || null,
            archivo_url: publicUrlData?.publicUrl || null,
            nombre_archivo: evidencia.name,
            tipo_mime: evidencia.type || null,
            tamaño_bytes: evidencia.size || null,
            laboratorio_id: solicitud.laboratorio_id,
          }
        }
      }

      // NO se envía fecha_prueba: no es editable.
      const sfData: Record<string, any> = {
        estado: fase.estado,
        fecha_finalizacion: fase.fechaFinalizacion || null,
      }
      if ((completando || enProgreso) && empleadoNombre) sfData.realizado_por = empleadoNombre

      try {
        await persistirDirecto(fase, sfData, evMeta)
      } catch (errDirecto: any) {
        console.warn('Guardado directo falló, se intenta por API:', errDirecto)
        await persistirPorApi(fase, sfData, evMeta, errDirecto)
      }

      // Recargar desde la BD para que la tabla refleje el estado real
      await loadFases()
      return true
    } catch (e: any) {
      alert('Error al guardar la fase: ' + (e?.message || 'desconocido'))
      return false
    } finally {
      setSavingFaseFilaId(null)
    }
  }

  /**
   * Click en "Guardar" de una fila:
   * - Si el nuevo estado es COMPLETADO -> pide evidencia (abre el diálogo).
   * - Cualquier otro estado -> guarda directamente, sin evidencia.
   */
  async function handleClickGuardarFila(fase: any, edit: { estado: string; fechaFinalizacion: string }) {
    const payload = {
      ...fase,
      estado: edit.estado,
      fechaFinalizacion: edit.fechaFinalizacion,
    }
    if (isFaseCompletada(edit.estado)) {
      setEvidenciaFile(null)
      setFaseParaEvidencia(payload)
      setOpenEvidenceDialog(true)
      return
    }
    await handleSaveFaseFila(payload, null)
  }

  async function handleSubirEvidencia() {
    if (!faseParaEvidencia || !evidenciaFile) return
    setSubiendoEvidencia(true)
    try {
      const ok = await handleSaveFaseFila(faseParaEvidencia, evidenciaFile)
      if (ok) {
        setOpenEvidenceDialog(false)
        setFaseParaEvidencia(null)
        setEvidenciaFile(null)
      }
    } finally {
      setSubiendoEvidencia(false)
    }
  }

  if (loading) {
    return (
      <AppShell sidebar="empleado">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => router.back()}>
              <ChevronLeft className="size-4" />
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold text-primary">Detalle de solicitud</h1>
              <p className="text-sm text-muted-foreground font-mono">#{id}</p>
            </div>
          </div>
          <Card>
            <CardHeader><CardTitle>Cargando…</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Obteniendo los datos de la solicitud.</p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  if (!solicitud) {
    return (
      <AppShell sidebar="empleado">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => router.back()}>
              <ChevronLeft className="size-4" />
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold text-primary">Detalle de solicitud</h1>
              <p className="text-sm text-muted-foreground font-mono">#{id}</p>
            </div>
          </div>
          <Card>
            <CardHeader><CardTitle>No se encontró la solicitud</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No existe una solicitud con el ID <span className="font-mono">{id}</span>.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  // Datos para el visor de fichas (solo lectura)
  const codigoRaw = solicitud.codigo_trazabilidad || ''
  const codigoPartes = codigoRaw.split('-')
  const codigoTrazabilidadFicha =
    codigoPartes.length >= 2 ? `${codigoPartes[0]}-${codigoPartes[1]}` : codigoRaw
  const dientesFicha = selectedTeeth.map(String)

  // Exportación de la preescripción
  const codigoArchivo = solicitud.codigo_trazabilidad || solicitud.id
  const handleExportPreescripcion = () =>
    imprimirElemento(preescripcionRef.current, `Preescripcion-${codigoArchivo}`)

  const faseTexto = faseSeleccionada
    ? `${faseSeleccionada.orden}. ${faseSeleccionada.nombre}`
    : (selectedFaseId || solicitud.fase_id || (fases.length ? `${fases[fases.length - 1].orden}. ${fases[fases.length - 1].nombre}` : '—'))

  return (
    <AppShell sidebar="empleado">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => router.back()}>
              <ChevronLeft className="size-4" />
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold text-primary">Detalle de solicitud</h1>
              <p className="text-sm text-muted-foreground font-mono">
                {solicitud.codigo_trazabilidad ? `Código: ${solicitud.codigo_trazabilidad}` : `#${solicitud.id}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {estadoOpt && (
              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                {estadoOpt.label}
              </span>
            )}
            {prioridadOpt && (
              <span className="inline-flex rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                {prioridadOpt.label}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExportPreescripcion}
            >
              <FileText className="size-4" />
              Exportar preescripción
            </Button>
            {isEditingFase ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={handleCancelFase}
                  disabled={savingFase}
                >
                  <X className="size-3" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={handleSaveFase}
                  disabled={savingFase}
                >
                  {savingFase ? (
                    <>
                      <RefreshCw className="size-3 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    <>
                      <Save className="size-3" />
                      Guardar fase
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setIsEditingFase(true)}
                disabled={fases.length === 0}
                title="Cambiar fase"
              >
                <RefreshCw className="size-3" />
                Cambiar fase
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información de la solicitud</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Paciente" value={solicitud.paciente || '—'} />
            <InfoRow label="CC. paciente" value={solicitud.cc_paciente || '—'} />
            <InfoRow label="Fecha de entrega" value={solicitud.fecha_entrega || '—'} />
            <InfoRow label="Tipo de trabajo" value={solicitud.tipo || '—'} />
            <InfoRow label="Estado" value={estadoOpt?.label || solicitud.estado || '—'} />
            <InfoRow label="Prioridad" value={prioridadOpt?.label || solicitud.prioridad || '—'} />
            {isEditingFase ? (
              <div className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Fase actual</span>
                <select
                  value={selectedFaseId ?? ''}
                  onChange={(e) => setSelectedFaseId(e.target.value || null)}
                  className={SELECT_CLASS}
                  disabled={fases.length === 0 || savingFase}
                >
                  <option value="">Seleccionar fase…</option>
                  {fases.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.orden}. {f.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <InfoRow label="Fase actual" value={faseTexto} />
            )}
            <InfoRow label="Progreso" value={`${progresoDerivado}%`} />
            <InfoRow label="Odontólogo / Clínica" value={solicitud.odontologonombre || '—'} />
            <InfoRow label="Correo" value={solicitud.odontologo_email || '—'} />
            <InfoRow label="Teléfono" value={solicitud.odontologo_telefono || '—'} />
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Dientes registrados</span>
              <DentalChart
                selectedTeeth={selectedTeeth}
                toothStatuses={{} as Record<number, ToothStatus>}
                onToothSelect={() => {}}
                onToothStatusChange={() => {}}
                onToothStatusClear={() => {}}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Dientes: <span className="font-mono">{solicitud.dientes || '—'}</span>
              </p>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-xs text-muted-foreground mb-1">Productos</span>
              <span className="text-sm text-foreground whitespace-pre-wrap">{stripPrices(solicitud.productos) || '—'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-xs text-muted-foreground mb-1">Piezas enviadas</span>
              <span className="text-sm text-foreground whitespace-pre-wrap">{stripPrices(solicitud.piezas_enviadas) || '—'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="block text-xs text-muted-foreground mb-1">Indicaciones</span>
              <span className="text-sm text-foreground whitespace-pre-wrap">{solicitud.indicaciones || '—'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Documentos adjuntos</span>
              {adjuntos.length > 0 ? (
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {adjuntos.map((adj, idx) => (
                    <div key={idx} className="group relative">
                      {adj.esImagen && adj.href ? (
                        <a href={adj.href} target="_blank" rel="noreferrer" className="block">
                          <div className="overflow-hidden rounded-lg border border-border bg-secondary/30">
                            <img
                              src={adj.href}
                              alt={adj.nombre}
                              className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                          <p className="mt-1 truncate text-xs text-primary underline">{adj.nombre}</p>
                        </a>
                      ) : adj.href ? (
                        <a
                          href={adj.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
                        >
                          <FileText className="size-5 shrink-0 text-muted-foreground" />
                          <span className="truncate text-xs text-primary underline">{adj.nombre}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-3">
                          <FileText className="size-5 shrink-0 text-muted-foreground" />
                          <span className="truncate text-xs text-muted-foreground">{adj.nombre}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Sin documentos adjuntos</span>
              )}
            </div>
            {solicitud.firma_odontologo ? (
              <div className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Firma del odontólogo</span>
                <img
                  src={solicitud.firma_odontologo}
                  alt="Firma del odontólogo"
                  className="mt-1 max-h-24 w-full max-w-xs rounded-lg border border-border object-contain bg-white"
                />
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Términos de garantía</span>
              {garantia ? (
                <div className="mt-1 rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-sm font-medium text-foreground">Documento disponible</p>
                  <p className="text-xs text-muted-foreground">
                    Archivo: <a href={GARANTIA_VIEWER_URL(solicitud.id)} target="_blank" rel="noreferrer" className="underline">{garantia.nombre_archivo}</a>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Creado: {new Date(garantia.created_at).toLocaleString('es-ES')}
                  </p>
                  {garantia.notas && (
                    <p className="text-xs text-muted-foreground">
                      Notas: {garantia.notas}
                    </p>
                  )}
                  {isViewableDocument(garantia.nombre_archivo, garantia.tipo_mime) && (
                    <iframe
                      src={GARANTIA_VIEWER_URL(solicitud.id)}
                      title={garantia.nombre_archivo || 'Documento de garantía'}
                      className="mt-3 h-[420px] w-full rounded-lg border border-border bg-white"
                    />
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Sin términos de garantía</span>
              )}
            </div>
            <InfoRow label="Creada" value={new Date(solicitud.created_at).toLocaleString('es-ES')} />
            <InfoRow label="Actualizada" value={new Date(solicitud.updated_at).toLocaleString('es-ES')} />
            <div className="sm:col-span-2">
              <span className="text-xs text-muted-foreground">Notas</span>
              <span className="text-sm text-foreground whitespace-pre-wrap">
                {solicitud.notas || '—'}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fases de fabricación</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Realizada por</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha finalización</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha prueba</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(function () {
                    const grupos: Record<string, { nombre: string; items: any[] }> = {}
                    filasFases.forEach((row: any) => {
                      const nombreProducto = row.nombreProducto || 'Producto'
                      if (!grupos[nombreProducto]) grupos[nombreProducto] = { nombre: nombreProducto, items: [] }
                      grupos[nombreProducto].items.push(row)
                    })
                    return Object.entries(grupos).map(([nombreProducto, grupo]: any) => (
                      <Fragment key={nombreProducto}>
                        <tr className="bg-secondary/40">
                          <td colSpan={6} className="px-4 py-2 font-semibold text-foreground">
                            {nombreProducto}
                          </td>
                        </tr>
                        {[...grupo.items]
                          .sort((a: any, b: any) => a.orden - b.orden)
                          .map((fase: any) => {
                            // Bloqueo basado en lo que hay guardado en la BD (no en lo que el usuario está editando)
                            const estaCompletada = isFaseCompletada(fase.estado)
                            const edit = faseEdits[fase.id] || {
                              estado: normalizeEstadoFase(fase.estado),
                              fechaFinalizacion: fase.fecha_finalizacion || '',
                            }
                            // Si el estado de la BD no está en la lista, se agrega para que se muestre tal cual
                            const opcionesEstado: { value: string; label: string }[] = [...ESTADO_FASE_OPTIONS]
                            if (!opcionesEstado.some((o) => o.value === edit.estado)) {
                              const extra = ESTADO_OPTIONS.find((o) => o.value === edit.estado)
                              opcionesEstado.push({ value: edit.estado, label: extra?.label || edit.estado })
                            }
                            const guardandoEstaFila = savingFaseFilaId === fase.id
                            return (
                              <tr key={fase.id} className="transition-colors hover:bg-secondary/30">
                                <td className="px-4 py-3">
                                  <span className="font-medium text-foreground">{fase.nombreFase}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={edit.estado}
                                    onChange={(e) =>
                                      setFaseEdits((prev) => ({
                                        ...prev,
                                        [fase.id]: { ...(prev[fase.id] || edit), estado: e.target.value },
                                      }))
                                    }
                                    className={SELECT_CLASS + ' ' + (estaCompletada ? 'text-green-800 bg-green-50 border-green-300' : '')}
                                    disabled={estaCompletada || guardandoEstaFila}
                                  >
                                    {opcionesEstado.map((o) => (
                                      <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  {(() => {
                                    const edit = faseEdits[fase.id]
                                    const estadoEdit = edit?.estado || normalizeEstadoFase(fase.estado)
                                    const enProgresoOCompletado = estadoEdit === 'en_progreso' || isFaseCompletada(estadoEdit)
                                    if (enProgresoOCompletado && empleadoActual) {
                                      return <span className="text-sm text-foreground">{empleadoActual}</span>
                                    }
                                    return <span className="text-sm text-foreground">{fase.realizado_por || '—'}</span>
                                  })()}
                                </td>
                                <td className="px-4 py-3">
                                  <Input
                                    type="date"
                                    value={toYMD(edit.fechaFinalizacion)}
                                    onChange={(e) =>
                                      setFaseEdits((prev) => ({
                                        ...prev,
                                        [fase.id]: { ...(prev[fase.id] || edit), fechaFinalizacion: e.target.value },
                                      }))
                                    }
                                    className={SELECT_CLASS}
                                    disabled={estaCompletada || guardandoEstaFila}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  {/* Fecha de prueba: SOLO LECTURA, nunca editable */}
                                  <Input
                                    type="date"
                                    value={toYMD(fase.fecha_prueba)}
                                    readOnly
                                    disabled
                                    tabIndex={-1}
                                    className={SELECT_CLASS + ' cursor-not-allowed opacity-70'}
                                  />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Button
                                    size="sm"
                                    onClick={() => handleClickGuardarFila(fase, edit)}
                                    disabled={estaCompletada || guardandoEstaFila}
                                    className="w-full"
                                  >
                                    {guardandoEstaFila ? (
                                      <>
                                        <RefreshCw className="size-3 mr-1.5 animate-spin" />
                                        Guardando…
                                      </>
                                    ) : (
                                      <>
                                        <Save className="size-3 mr-1.5" />
                                        Guardar
                                      </>
                                    )}
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                      </Fragment>
                    ))
                  })()}
                  {filasFases.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                        No hay fases disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Incidencias</CardTitle></CardHeader>
          <CardContent>
            {incidencias.length === 0 ? (
              <span className="text-sm text-muted-foreground">Sin incidencias registradas</span>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-2">Tipo</th>
                    <th className="py-2 pr-2">Estado</th>
                    <th className="py-2 pr-2">Descripción</th>
                    <th className="py-2 pr-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {incidencias.map((inc: any) => (
                    <Fragment key={inc.id}>
                      <tr
                        className="border-b border-border/50 cursor-pointer hover:bg-secondary/30"
                        onClick={async () => {
                          if (medidasPorInc[inc.id]) {
                            setMedidasPorInc((prev) => {
                              const next = { ...prev }
                              delete next[inc.id]
                              return next
                            })
                            return
                          }
                          const { data } = await supabase
                            .from('incidencia_medidas')
                            .select('*')
                            .eq('incidencia_id', inc.id)
                          setMedidasPorInc((prev) => ({ ...prev, [inc.id]: data || [] }))
                        }}
                      >
                        <td className="py-2 pr-2 font-medium text-foreground">{inc.tipo}</td>
                        <td className="py-2 pr-2 text-muted-foreground">{inc.estado}</td>
                        <td className="py-2 pr-2 text-foreground">{inc.descripcion}</td>
                        <td className="py-2 pr-2 text-muted-foreground whitespace-nowrap">{inc.fecha} {inc.hora}</td>
                      </tr>
                      {medidasPorInc[inc.id] && (
                        <tr>
                          <td colSpan={4} className="pb-2">
                            <div className="overflow-x-auto ml-4">
                              {medidasPorInc[inc.id].length === 0 ? (
                                <span className="text-xs text-muted-foreground">Sin medidas registradas</span>
                              ) : (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-border text-left text-muted-foreground">
                                      <th className="py-1 pr-2">Medida tomada</th>
                                      <th className="py-1 pr-2">Responsable</th>
                                      <th className="py-1 pr-2">Fecha resolución</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {medidasPorInc[inc.id].map((m: any) => (
                                      <tr key={m.id} className="border-b border-border/50">
                                        <td className="py-1 pr-2 text-foreground">{m.medidas_tomadas}</td>
                                        <td className="py-1 pr-2 text-muted-foreground">{m.responsable || '—'}</td>
                                        <td className="py-1 pr-2 text-muted-foreground">{m.fecha_resolucion || '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <textarea
                value={nuevaObservacion}
                onChange={(e) => setNuevaObservacion(e.target.value)}
                placeholder="Escribir observación..."
                className="min-h-[80px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
                disabled={guardandoObservacion}
              />
              <Button
                onClick={handleAgregarObservacion}
                disabled={guardandoObservacion || !nuevaObservacion.trim()}
                className="sm:self-start"
              >
                {guardandoObservacion ? (
                  <>
                    <RefreshCw className="size-3 animate-spin mr-1" />
                    Guardando…
                  </>
                ) : (
                  'Agregar'
                )}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Fecha</th>
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {observaciones.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-sm text-muted-foreground">
                        Sin observaciones
                      </td>
                    </tr>
                  ) : (
                    [...observaciones]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((obs) => (
                        <tr key={obs.id} className="border-b border-border/50">
                          <td className="py-2 px-2 align-top whitespace-nowrap text-xs text-muted-foreground">
                            {obs.created_at ? new Date(obs.created_at).toLocaleString('es-ES') : '—'}
                          </td>
                          <td className="py-2 px-2 text-foreground whitespace-pre-wrap">{obs.texto || '—'}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Materiales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={materialSel}
                onChange={(e) => setMaterialSel(e.target.value)}
                className="flex-1 h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
                disabled={guardandoMaterial || catalogoMateriales.length === 0}
              >
                <option value="">
                  {catalogoMateriales.length === 0 ? 'No hay materiales registrados en el laboratorio' : 'Seleccionar material...'}
                </option>
                {catalogoMateriales
                  .filter((m) => !materialesSolicitud.some((x) => x.material_id === m.id))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {(m.codigo ? m.codigo + ' - ' : '') + (m.nombre || m.material || 'Material')}
                      {m.numero_lote ? ' · Lote ' + m.numero_lote : ''}
                    </option>
                  ))}
              </select>
              <Button
                onClick={handleAgregarMaterial}
                disabled={guardandoMaterial || !materialSel}
                className="sm:self-start"
              >
                {guardandoMaterial ? (
                  <>
                    <RefreshCw className="size-3 animate-spin mr-1" />
                    Agregando…
                  </>
                ) : (
                  'Agregar'
                )}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Material</th>
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Producto</th>
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Número de lote</th>
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Fabricante</th>
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Proveedor</th>
                    <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {materialesSolicitud.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-sm text-muted-foreground">
                        Sin materiales agregados
                      </td>
                    </tr>
                  ) : (
                    materialesSolicitud.map((m) => (
                      <tr key={m.id} className="border-b border-border/50">
                        <td className="py-2 px-2 text-foreground">{m.material || '—'}</td>
                        <td className="py-2 px-2 text-foreground">{m.producto || '—'}</td>
                        <td className="py-2 px-2 text-foreground">{m.numero_lote || '—'}</td>
                        <td className="py-2 px-2 text-foreground">{m.marca_fabricante || '—'}</td>
                        <td className="py-2 px-2 text-foreground">{m.proveedor || '—'}</td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleEliminarMaterial(m.id)}
                            disabled={eliminandoMaterialId === m.id}
                            className="text-xs text-red-600 underline disabled:opacity-50"
                          >
                            {eliminandoMaterialId === m.id ? 'Quitando…' : 'Eliminar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fichas técnicas</CardTitle>
          </CardHeader>
          <CardContent>
            {fichas.length > 0 ? (
              <ul className="divide-y divide-border">
                {fichas.map((ficha) => {
                  const nombre = ficha.nombre || ficha.nombre_archivo || 'Ficha técnica'
                  const fecha = formatFecha(ficha.fecha || ficha.created_at)
                  const conSecciones = tieneSecciones(ficha)
                  const href =
                    ficha.archivo_url ||
                    (ficha.nombre_archivo?.startsWith('http') ? ficha.nombre_archivo : null)
                  const archivoVisible = isViewableDocument(ficha.nombre_archivo, ficha.tipo_mime)

                  return (
                    <li
                      key={ficha.id}
                      className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {ficha.tipo ? `${ficha.tipo} · ` : ''}
                            {fecha}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {conSecciones ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setFichaVista(ficha)}
                          >
                            <Eye className="size-4" />
                            Ver
                          </Button>
                        ) : href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-accent underline"
                          >
                            {archivoVisible ? 'Abrir' : 'Descargar'}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin contenido</span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <span className="text-sm text-muted-foreground">Sin fichas técnicas registradas</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="sm:col-span-2">
              <span className="block text-xs text-muted-foreground mb-1">Encuesta posadaptación</span>
              {encuestas.posAdaptacion ? (
                <div className="mt-1 rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-sm font-medium text-foreground">Encuesta registrada</p>
                  <p className="text-xs text-muted-foreground">
                    Creada: {new Date(encuestas.posAdaptacion.created_at).toLocaleString('es-ES')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Paciente: {encuestas.posAdaptacion.nombre_paciente || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Profesional: {encuestas.posAdaptacion.nombre_profesional || encuestas.posAdaptacion.profesional_email || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fecha entrega: {encuestas.posAdaptacion.fecha_entrega_paciente || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Buena adaptación inicial: {encuestas.posAdaptacion.buena_adaptacion_inicial ? 'Sí' : 'No'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Adecuada estética: {encuestas.posAdaptacion.adecuada_estetica ? 'Sí' : 'No'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ajuste oclusal adecuado: {encuestas.posAdaptacion.ajuste_oclusal_adecuado ? 'Sí' : 'No'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Color adecuado: {encuestas.posAdaptacion.color_adecuado ? 'Sí' : 'No'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Opinión general: {encuestas.posAdaptacion.opinion_general || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Dispositivo cumple fines: {encuestas.posAdaptacion.dispositivo_cumple_fines || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Paciente conforme: {encuestas.posAdaptacion.paciente_conforme || '—'}
                  </p>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Sin encuesta posadaptación</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="sm:col-span-2">
              <span className="block text-xs text-muted-foreground mb-1">Buzón de quejas / reclamos / sugerencias</span>
              {encuestas.buzon ? (
                <div className="mt-1 rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-sm font-medium text-foreground">Solicitud registrada</p>
                  <p className="text-xs text-muted-foreground">
                    Tipo: {encuestas.buzon.tipo || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Estado: {encuestas.buzon.estado === 'pendiente' ? 'Pendiente por contestar' : encuestas.buzon.estado || 'Pendiente por contestar'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Solicitante: {encuestas.buzon.nombre_apellido || encuestas.buzon.correo_electronico || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Descripción: {encuestas.buzon.descripcion || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Notificaciones: {[
                      encuestas.buzon.notificacion_email && 'Correo',
                      encuestas.buzon.notificacion_whatsapp && 'WhatsApp',
                      encuestas.buzon.notificacion_presencial && 'Presencial',
                    ].filter(Boolean).join(', ') || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Comentarios adicionales: {encuestas.buzon.comentarios_adicionales || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Creada: {new Date(encuestas.buzon.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Sin registros en buzón</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ============================================================
            PREESCRIPCIÓN (oculta en pantalla; solo se usa para exportar)
            Contiene únicamente: código de trazabilidad, datos del laboratorio
            y los datos del detalle de la solicitud con el dentalgrama.
           ============================================================ */}
        <div
          aria-hidden="true"
          style={{ position: 'fixed', left: '-10000px', top: 0, width: '800px', pointerEvents: 'none' }}
        >
          <div ref={preescripcionRef}>
            <div style={{ background: '#fff', color: '#111', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 12, padding: 8 }}>
              {/* Encabezado: laboratorio + código de trazabilidad */}
              <div
                className="no-break"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16,
                  borderBottom: '2px solid #111',
                  paddingBottom: 10,
                  marginBottom: 14,
                }}
              >
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{laboratorio?.nombre || 'Laboratorio'}</div>
                  {laboratorio?.nit ? <div>NIT: {laboratorio.nit}</div> : null}
                  {laboratorio?.direccion || laboratorio?.ciudad ? (
                    <div>{[laboratorio?.direccion, laboratorio?.ciudad].filter(Boolean).join(' - ')}</div>
                  ) : null}
                  {laboratorio?.telefono ? <div>Tel: {laboratorio.telefono}</div> : null}
                  {laboratorio?.correo ? <div>{laboratorio.correo}</div> : null}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>PREESCRIPCIÓN</div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ color: '#555' }}>Código de trazabilidad</span>
                    <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700 }}>
                      {solicitud.codigo_trazabilidad || `#${solicitud.id}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos de la solicitud */}
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Detalle de solicitud</div>
              <div
                className="no-break"
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: 12 }}
              >
                <PrintField label="Paciente" value={solicitud.paciente} full />
                <PrintField label="CC. paciente" value={solicitud.cc_paciente} />
                <PrintField label="Fecha de entrega" value={solicitud.fecha_entrega} />
                <PrintField label="Tipo de trabajo" value={solicitud.tipo} />
                <PrintField label="Estado" value={estadoOpt?.label || solicitud.estado} />
                <PrintField label="Prioridad" value={prioridadOpt?.label || solicitud.prioridad} />
                <PrintField label="Fase actual" value={faseTexto === '—' ? '' : faseTexto} />
                <PrintField label="Progreso (%)" value={`${progresoDerivado}%`} />
                <PrintField label="Asignado a" value={solicitud.asignado_a} />
                <PrintField label="Odontólogo / Clínica" value={solicitud.odontologonombre} />
                <PrintField label="Correo" value={solicitud.odontologo_email} />
                <PrintField label="Teléfono" value={solicitud.odontologo_telefono} />
                <PrintField label="Productos" value={stripPrices(solicitud.productos)} full />
                <PrintField label="Piezas enviadas" value={stripPrices(solicitud.piezas_enviadas)} full />
                <PrintField label="Indicaciones" value={solicitud.indicaciones} full />
                <PrintField
                  label="Documentos adjuntos"
                  value={
                    Array.isArray(solicitud.archivos) && solicitud.archivos.length > 0
                      ? solicitud.archivos.map(nombreArchivoAdjunto).join(', ')
                      : ''
                  }
                  full
                />
              </div>

              {/* Dentalgrama */}
              <div className="no-break" style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Dientes registrados</div>
                <DentalChart
                  selectedTeeth={selectedTeeth}
                  toothStatuses={{} as Record<number, ToothStatus>}
                  onToothSelect={() => {}}
                  onToothStatusChange={() => {}}
                  onToothStatusClear={() => {}}
                />
                <div style={{ marginTop: 4, fontSize: 11 }}>
                  Dientes: <span style={{ fontFamily: 'monospace' }}>{solicitud.dientes || '—'}</span>
                </div>
              </div>

              <PrintField label="Notas" value={solicitud.notas} full />

              {/* Firma */}
              <div className="no-break" style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Firma del odontólogo</div>
                {solicitud.firma_odontologo ? (
                  <img
                    src={solicitud.firma_odontologo}
                    alt="Firma del odontólogo"
                    style={{ maxHeight: 90, maxWidth: 260, objectFit: 'contain', border: '1px solid #ccc', background: '#fff' }}
                  />
                ) : (
                  <div style={{ fontSize: 11, color: '#777' }}>Sin firma</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de evidencia: SOLO se abre cuando la fase se guarda como COMPLETADO */}
      {openEvidenceDialog && faseParaEvidencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Subir evidencia de fase</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              Fase: <span className="font-medium">{faseParaEvidencia.nombreFase || faseParaEvidencia.nombre}</span>
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Para marcar la fase como completada debe adjuntar una evidencia (foto).
            </p>
            <div className="flex flex-col gap-2 mb-4 sm:flex-row">
              <label className="flex-1 cursor-pointer rounded-full border border-input bg-card px-4 py-2 text-sm font-semibold text-foreground text-center hover:bg-secondary/50">
                Subir foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    setEvidenciaFile(file)
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="flex-1 cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground text-center hover:bg-primary/90"
              >
                Tomar foto
              </button>
            </div>
            {evidenciaFile && (
              <p className="mb-4 truncate text-xs text-foreground">
                Archivo seleccionado: <span className="font-medium">{evidenciaFile.name}</span>
              </p>
            )}
            {cameraOpen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
                <div className="bg-card rounded-xl p-4 w-full max-w-md space-y-3">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black" />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCameraOpen(false)}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const video = videoRef.current
                        if (!video) return
                        const canvas = document.createElement('canvas')
                        canvas.width = video.videoWidth
                        canvas.height = video.videoHeight
                        const ctx = canvas.getContext('2d')
                        if (!ctx) return
                        ctx.drawImage(video, 0, 0)
                        canvas.toBlob((blob) => {
                          if (!blob) return
                          const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' })
                          setEvidenciaFile(file)
                          setCameraOpen(false)
                        }, 'image/jpeg', 0.9)
                      }}
                    >
                      Capturar
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={subiendoEvidencia}
                onClick={() => {
                  setOpenEvidenceDialog(false)
                  setFaseParaEvidencia(null)
                  setEvidenciaFile(null)
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSubirEvidencia}
                disabled={subiendoEvidencia || !evidenciaFile}
              >
                {subiendoEvidencia ? 'Guardando…' : 'Completar fase'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {fichaVista && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50"
          onClick={() => setFichaVista(null)}
        >
          <div
            className="my-8 flex max-h-[90vh] w-full max-w-[850px] flex-col rounded-xl bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border p-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {fichaVista.tipo || fichaVista.nombre || 'Ficha técnica'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatFecha(fichaVista.fecha || fichaVista.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFichaVista(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-neutral-200">
              {(() => {
                const tipo = fichaVista.tipo || fichaVista.nombre || ''
                const secciones = (fichaVista.secciones || []) as SeccionFicha[]

                const propsComunes = {
                  secciones,
                  onCampoChange: () => {},
                  editing: false,
                  onToggleEditing: () => {},
                  onDownload: () => {},
                  downloading: false,
                  showToolbar: false,
                  nombreTipo: tipo,
                }

                if (tipo === 'Colado UCLA') {
                  return (
                    <FichaTecnicaColadoUcla
                      {...propsComunes}
                      dientes={dientesFicha}
                      codigoTrazabilidad={codigoTrazabilidadFicha}
                    />
                  )
                }

                if (tipo === 'Cerámica Encia') {
                  return (
                    <FichaTecnicaCeramicaEncia
                      {...propsComunes}
                      dientes={dientesFicha}
                      codigoTrazabilidad={codigoTrazabilidadFicha}
                    />
                  )
                }

                return <FichaTecnicaGenerica {...propsComunes} />
              })()}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border p-6">
              <Button variant="outline" onClick={() => setFichaVista(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="mt-0.5 block text-sm text-foreground break-words">{value}</span>
    </div>
  )
}

function PrintField({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div className="no-break" style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <div style={{ fontSize: 11, color: '#555' }}>{label}</div>
      <div style={{ fontSize: 12, whiteSpace: 'pre-wrap', borderBottom: '1px solid #ddd', paddingBottom: 2, minHeight: 16 }}>
        {value && String(value).trim() ? value : '—'}
      </div>
    </div>
  )
}

function stripPrices(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/a\s*\$\s*[\d.,]+/gi, '')
    .replace(/\$\s*[\d.,]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}
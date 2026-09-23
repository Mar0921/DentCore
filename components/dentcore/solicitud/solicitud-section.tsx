'use client'

import { useState, useMemo, useRef, useId, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox, CheckboxIndicator } from '@/components/ui/checkbox'
import { DentalChart } from './dental-chart'
import { CalendarIcon, Upload, File, X, Save, RotateCcw } from 'lucide-react'
import type { SolicitudEntry, SolicitudFormData, ToothStatus, UploadedFile } from './solicitud-types'

const TIPOS_TRABAJO_PRINCIPAL = [
  'LIBRE DE METAL',
  'ENCERADOS',
  'METAL',
  'RESINAS IMPRESAS',
  'ACRÍLICOS',
  'IMPLANTOLOGÍA',
]

const GUIAS_Y_TONOS: Record<string, string[]> = {
  'VITAPAN Classical': ['M1', 'M2', 'M3', 'A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4'],
  'VITAPAN 3D Master': ['0M1', '0M2', '0M3', '1M1', '1M2', '2L1.5', '2L2.5', '2M1', '2M2', '2M3', '2R1.5', '2R2.5', '3L1.5', '3L2.5', '3M1', '3M2', '3M3', '3R1.5', '3R2.5', '4L1.5', '4L2.5', '4M1', '4M2', '4M3', '4R1.5', '4R2.5', '5M1', '5M2', '5M3'],
  'Ivoclar Vivodent PE': ['01', '1A', '2A', '1C', '2B', '1D', '1E', '2C', '3A', '5B', '2E', '3E', '4A', '6B', '4B', '6C', '6D', '4C', '3C', '4D'],
  'Ivoclar Vivodent Chromascop': ['110', '120', '130', '140', '150', '160', '170', '180', '190', '200', '210', '220', '230', '240', '250', '260', '270', '280', '290', '300', '310', '320', '330', '340', '350', '360', '370', '380', '390', '400', '410', '420', '430', '440', '450', '460', '470', '480', '490', '500', '510', '520', '530', '540'],
  'Ivoclar Vivadent A-D + Bleach': ['BL1', 'BL2', 'BL3', 'BL4', 'A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4'],
  'IPS Natural Die Material': ['ND', 'ND2', 'ND3', 'ND4', 'ND5', 'ND6', 'ND7', 'ND8', 'ND9'],
  'Odilux': ['11A', '11C', '11D', '11E', '12A', '12B', '12C', '12E', '13A', '13C', '13E', '14A', '14B', '14C', '14D', '15B', '16B', '16C', '16D'],
  'Odident': ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4'],
  'Acry Lux': ['1A', '2A', '3A', '4A', '2B', '4B', '5B', '6B', '1C', '2C', '3C', '4C', '6C', '1D', '4D', '6D', '1E', '2E', '3E'],
  'Acry Lux V': ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B0', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4', 'BL'],
  'Acry Plus': ['1A', '2A', '3A', '4A', '2B', '4B', '5B', '6B', '1C', '2C', '3C', '4C', '6C', '1D', '4D', '6D', '1E', '2E', '3E'],
  'Acry Plus V': ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4'],
  'Trubyte New Hue': ['59', '60', '61', '62', '65', '66', '67', '68', '69', '77', '78', '81', '87'],
  'Kuraray Noritake': ['NW0', 'NW0.5', 'A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4', 'NP1.5', 'NP2.5'],
  'Trilux Acrylic Teeth': ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'C2', 'C3', 'D3', 'D4'],
  'GC Initial': ['IN-43', 'IN-44', 'IN-46', 'INC', 'CL-F', 'D-A1', 'D-A2', 'D-A3', 'D-A3.5', 'D-A4', 'D-B1', 'D-B2', 'D-B3', 'D-B4', 'D-C1', 'D-C2', 'D-C3', 'D-C4', 'D-D2', 'D-D3', 'D-D4', 'E-57', 'E-58', 'E-59', 'E-60', 'GL', 'TN', 'TO'],
  'Creation Willi Geller': ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4', 'TD-A1', 'TD-A2', 'TD-A3', 'TD-A3.5', 'TD-A4', 'TD-B1', 'TD-B2', 'TD-B3', 'TD-B4', 'TD-C1', 'TD-C2', 'TD-C3', 'TD-C4', 'TD-D2', 'TD-D3', 'TD-D4', 'TD-BA', '57', '58', '59', '60', 'CL-O', 'UC', 'NT', 'OT', 'TI-01', 'TI-02', 'TI-03', 'TI-04', 'TI-05', 'SI-01', 'SI-02', 'SI-03', 'SI-04', 'SI-05', 'SI-06', 'SO-10', 'SO-11', 'PS-0', 'PS-1', 'PS-2', 'PS-3', 'HT-51', 'HT-52', 'HT-53', 'HT-54', 'HT-55', 'HT-56', 'SP-21', 'SP-22', 'SP-23', 'SP-24', 'SP-25', 'SP-26', 'SP-27', 'SP-28', 'SP-29', 'SP-G', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'GN', 'OD-32', 'OD-37', 'OD-41', 'OD-42', 'OD-43', 'OD-44', 'O-AB', 'BD-A', 'BD-B', 'BD-BO', 'S-AB', 'SP-AB', 'KM'],
  'Noritake Tissue': ['1', '2', '3', '4', '5', '6', '7'],
  'Hass Amber Mill': ['W1', 'W2', 'W3', 'W4', 'A1', 'A2', 'A3', 'A3.5', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4'],
  'Duratone': ['A0', 'A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3'],
}

interface SolicitudSectionProps {
  solicitud: SolicitudEntry
  index: number
  idPrefix: string
  onToothDrawRef?: (ref: unknown) => void
  onUpdate: (updates: Partial<SolicitudEntry>) => void
  onFormDataChange: (updates: Partial<SolicitudFormData>) => void
  odontologoPrecargado?: { nombre: string; email?: string; telefono?: string }
}

interface Producto {
  id: string
  titulo?: string
  nombre?: string
  description?: string
  material?: string
  categoria?: string
  precio: number
}

function formatoPrecio(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`
}

const SIGNATURE_STROKE_STYLE = '#000000'
const SIGNATURE_BACKGROUND = '#ffffff'

interface SignatureCanvasProps {
  value: string
  onChange: (dataUrl: string) => void
}

function SignatureCanvas({ value, onChange }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDirty, setIsDirty] = useState(false)

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    return ctx
  }, [])

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = getCanvasContext()
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scale = canvas.width / rect.width

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2.5 * scale
    ctx.strokeStyle = SIGNATURE_STROKE_STYLE
  }, [getCanvasContext])

  const clearCanvas = useCallback(() => {
    const ctx = getCanvasContext()
    if (!ctx || !canvasRef.current) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    ctx.fillStyle = SIGNATURE_BACKGROUND
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }, [getCanvasContext])

  const saveSignature = useCallback(() => {
    if (!canvasRef.current) return
    const dataUrl = canvasRef.current.toDataURL('image/png')
    onChange(dataUrl)
  }, [onChange])

  const clearSignature = useCallback(() => {
    const ctx = getCanvasContext()
    if (!ctx || !canvasRef.current) return
    clearCanvas()
    onChange('')
    setIsDirty(false)
  }, [clearCanvas, onChange, getCanvasContext])

  let isDrawing = false

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing = true
    const ctx = getCanvasContext()
    if (!ctx || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = canvasRef.current.width / rect.width
    const scaleY = canvasRef.current.height / rect.height

    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    ctx.beginPath()
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY)
    setIsDirty(true)
    },
    [getCanvasContext],
  )

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return
      const ctx = getCanvasContext()
      if (!ctx || !canvasRef.current) return

      e.preventDefault()

      const rect = canvasRef.current.getBoundingClientRect()
      const scaleX = canvasRef.current.width / rect.width
      const scaleY = canvasRef.current.height / rect.height

      let clientX: number, clientY: number
      if ('touches' in e) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY)
      ctx.stroke()
    },
    [getCanvasContext],
  )

  const stopDrawing = useCallback(() => {
    isDrawing = false
  }, [])

  const loadExistingSignature = useCallback(() => {
    if (value) {
      const ctx = getCanvasContext()
      if (!ctx || !canvasRef.current) return
      clearCanvas()
      const img = new Image()
      img.onload = () => {
        if (canvasRef.current && ctx) {
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height)
          setIsDirty(true)
        }
      }
      img.src = value
    }
  }, [value, clearCanvas, getCanvasContext])

  useEffect(() => {
    initCanvas()
    clearCanvas()
    loadExistingSignature()
  }, [initCanvas, clearCanvas, loadExistingSignature])

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          className="w-full max-w-[400px] rounded-lg border border-border bg-white cursor-crosshair"
          style={{ touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {value && !isDirty && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Firma guardada
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={saveSignature}
          className="gap-1.5"
          disabled={!isDirty}
        >
          <Save className="size-4" />
          Guardar firma
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
          className="gap-1.5"
        >
          <RotateCcw className="size-4" />
          Limpiar
        </Button>
      </div>
    </div>
  )
}

const GUIAS_LISTA = Object.keys(GUIAS_Y_TONOS)

export function SolicitudSection({
  solicitud,
  index,
  idPrefix,
  onToothDrawRef,
  onUpdate,
  onFormDataChange,
  odontologoPrecargado,
}: SolicitudSectionProps) {
  const { formData, servicioTipo, selectedTeeth, toothStatuses, uploadedFiles } = solicitud
  const [productoPendiente, setProductoPendiente] = useState('')
  const [odontoEditMode, setOdontoEditMode] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const uniqueId = useId()
  const stableIdPrefix = `${idPrefix}-${uniqueId}`

  useEffect(() => {
    if (!odontologoPrecargado) return
    onFormDataChange({
      odontologo: odontologoPrecargado.nombre || formData.odontologo,
      correo: odontologoPrecargado.email ?? formData.correo,
      telefono: odontologoPrecargado.telefono ?? formData.telefono,
    })
  }, [odontologoPrecargado?.nombre, odontologoPrecargado?.email, odontologoPrecargado?.telefono])

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const { data, error } = await supabase.from('cliente').select('*').order('nombre')
        if (!error && data) setClientes(data)
      } catch {
        // ignore
      }
    }
    fetchClientes()
  }, [])

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .eq('activo', true)
          .order('categoria', { ascending: true })
        if (!error && data) setProductos(data as Producto[])
      } catch {
        // ignore
      }
    }
    fetchProductos()
  }, [])

  const productosPorCategoria = useMemo(() => {
    const grouped: Record<string, Producto[]> = {}
    productos.forEach((p) => {
      const cat = p.categoria || 'Otro'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(p)
    })
    return grouped
  }, [productos])

  const productosDisponibles = useMemo(() => {
    if (!servicioTipo) return []
    return productosPorCategoria[servicioTipo] || []
  }, [servicioTipo, productosPorCategoria])

  // ... resto del componente ...

  // En la sección de Piezas enviadas, usar stableIdPrefix en lugar de idPrefix
  // En el código de trazabilidad, agregar suppressHydrationWarning
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleToothSelect = (toothNumber: number) => {
    onUpdate({
      selectedTeeth: selectedTeeth.includes(toothNumber) ? selectedTeeth : [...selectedTeeth, toothNumber],
    })
  }

  const handleToothStatusChange = (toothNumber: number, status: ToothStatus) => {
    onUpdate({
      toothStatuses: { ...toothStatuses, [toothNumber]: status },
    })
  }

  const handleToothStatusClear = (toothNumber: number) => {
    const next = { ...toothStatuses }
    delete next[toothNumber]
    onUpdate({
      toothStatuses: next,
      selectedTeeth: selectedTeeth.filter((t) => t !== toothNumber),
    })
  }

  const selectedTeethDisplay = useMemo(() => {
    if (selectedTeeth.length === 0) return 'Ninguno'
    return selectedTeeth
      .slice()
      .sort((a, b) => a - b)
      .map((tooth) => {
        const status = toothStatuses[tooth]
        const producto = formData.productos.find((p) =>
          String(p.dientes || '').split(/[\s,\-]+/).includes(String(tooth)),
        )
        const servicio = producto ? producto.producto : servicioTipo
        const sufijo = status ? `-${servicio}-${status}` : servicio ? `-${servicio}` : ''
        return `${tooth}${sufijo}`
      })
      .join(', ')
  }, [selectedTeeth, toothStatuses, formData.productos, servicioTipo])

  const handleServicioTipoChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevo = event.target.value
    onUpdate({ servicioTipo: nuevo })
    setProductoPendiente('')
  }

  const marcarDientesDesdeProductos = (lineas: { dientes?: string }[]) => {
    const extra = new Set<number>()
    lineas.forEach((l) => {
      String(l.dientes || '').split(/[\s,\-]+/).forEach((t) => {
        const n = parseInt(t, 10)
        if (!isNaN(n) && n >= 1 && n <= 48) extra.add(n)
      })
    })
    const merged = Array.from(extra).sort((a, b) => a - b)
    const nextStatuses = { ...toothStatuses }
    Object.keys(nextStatuses).forEach((key) => {
      const num = Number(key)
      if (!merged.includes(num)) delete nextStatuses[num]
    })
    onUpdate({ selectedTeeth: merged, toothStatuses: nextStatuses })
  }

  const agregarProducto = () => {
    if (!productoPendiente) return
    const p = productosDisponibles.find((x) => (x.titulo || x.nombre) === productoPendiente)
    if (!p) return
    const nombre = p.titulo || p.nombre || ''
    if (formData.productos.some((x) => x.producto === nombre)) {
      setProductoPendiente('')
      return
    }
    onFormDataChange({
      productos: [
        ...formData.productos,
        {
          producto: nombre,
          unidades: 1,
          dientes: '',
          precio: p.precio,
          precioUnitario: p.precio,
        },
      ],
    })
    setProductoPendiente('')
  }

  const eliminarProducto = (index: number) => {
    onFormDataChange({
      productos: formData.productos.filter((_, i) => i !== index),
    })
  }

  const actualizarProducto = (index: number, campo: 'unidades' | 'dientes' | 'precioUnitario', valor: number | string) => {
    const actual = [...formData.productos]
    actual[index] = { ...actual[index], [campo]: valor }
    onFormDataChange({ productos: actual })
    if (campo === 'dientes') {
      marcarDientesDesdeProductos(actual)
    }
  }

  const handleCheckboxChange = (field: 'piezasEnviadas', value: string) => {
    const current = formData[field]
    onFormDataChange({
      [field]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
      const maxSize = 10 * 1024 * 1024
      return validTypes.includes(file.type) && file.size <= maxSize
    })

    const uploaded: UploadedFile[] = []
    for (const file of validFiles) {
      const ext = file.name.split('.').pop() || ''
      const storagePath = `public/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('solicitudes-documentos')
        .upload(storagePath, file)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('solicitudes-documentos')
          .getPublicUrl(storagePath)
        uploaded.push({
          name: file.name,
          url: publicUrl,
          size: file.size,
        })
      }
    }

    if (uploaded.length > 0) {
      onUpdate({ uploadedFiles: [...uploadedFiles, ...uploaded] })
    }
    e.target.value = ''
  }

  const removeFile = (fileIndex: number) => {
    onUpdate({ uploadedFiles: uploadedFiles.filter((_, i) => i !== fileIndex) })
  }

  return (
    <div className="solicitud-section space-y-6">
      {index > 0 && (
        <div className="bg-accent/15 px-3 py-2 border-b border-border text-xs font-semibold text-accent">
          Solicitud #{index + 1}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Información básica</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-primary">Odontólogo / Clínica</label>
              {odontologoPrecargado ? (
                <Input value={odontologoPrecargado.nombre || ''} disabled />
              ) : clientes.length > 0 ? (
                <>
                   <select
                     value={formData.odontologo ? formData.odontologo : '__select__'}
                     onChange={(e) => {
                       const value = e.target.value
                       if (value === '__custom__') {
                         setOdontoEditMode(true)
                         onFormDataChange({ odontologo: '' })
                       } else {
                         const clienteSeleccionado = clientes.find(
                           (c) => (c.nombre || c.clinica || c.email || '') === value
                         )
                         if (clienteSeleccionado) {
                           onFormDataChange({
                             odontologo: value,
                             correo: clienteSeleccionado.email || '',
                             telefono: clienteSeleccionado.telefono || '',
                             direccion: clienteSeleccionado.calle
                               ? `${clienteSeleccionado.calle}${clienteSeleccionado.localidad ? `, ${clienteSeleccionado.localidad}` : ''}`
                               : '',
                           })
                         } else {
                           onFormDataChange({ odontologo: value })
                         }
                       }
                     }}
                     className="h-10 w-full rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
                   >
                    <option value="__select__">Seleccionar odontólogo o clínica...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.nombre || c.clinica || c.email || ''}>
                        {c.nombre || c.clinica || c.email || 'Sin nombre'}
                      </option>
                    ))}
                    <option value="__custom__">Otro (especificar)</option>
                  </select>
                  {odontoEditMode && (
                    <Input
                      className="mt-2"
                      value={formData.odontologo}
                      onChange={(e) => onFormDataChange({ odontologo: e.target.value })}
                      placeholder="Nombre del odontólogo o clínica"
                    />
                  )}
                </>
              ) : (
                <Input
                  value={formData.odontologo}
                  onChange={(e) => onFormDataChange({ odontologo: e.target.value })}
                  placeholder="Nombre del odontólogo o clínica"
                />
              )}
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-primary">Registro médico</label>
              <Input
                value={formData.registroMedico}
                onChange={(e) => onFormDataChange({ registroMedico: e.target.value })}
                placeholder="Número de registro"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-primary">Correo</label>
              <Input
                type="email"
                value={formData.correo}
                onChange={(e) => onFormDataChange({ correo: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-primary">Teléfono</label>
              <Input
                type="tel"
                value={formData.telefono}
                onChange={(e) => onFormDataChange({ telefono: e.target.value })}
                placeholder="Número de contacto"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-primary">Paciente</label>
              <Input
                value={formData.paciente}
                onChange={(e) => onFormDataChange({ paciente: e.target.value })}
                placeholder="Nombre del paciente"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-primary">CC. Paciente</label>
              <Input
                value={formData.ccPaciente}
                onChange={(e) => onFormDataChange({ ccPaciente: e.target.value })}
                placeholder="Documento de identidad"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-primary">Dirección</label>
              <Input
                value={formData.direccion}
                onChange={(e) => onFormDataChange({ direccion: e.target.value })}
                placeholder="Dirección del paciente"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-primary">Historia clínica del paciente</label>
              <Textarea
                value={formData.historiaClinica}
                onChange={(e) => onFormDataChange({ historiaClinica: e.target.value })}
                placeholder="Historia clínica relevante..."
                className="min-h-[60px]"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-primary">Firma del odontólogo</label>
              <SignatureCanvas
                value={formData.firma}
                onChange={(dataUrl) => onFormDataChange({ firma: dataUrl })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Fechas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-primary">Fecha de elaboración</label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.fechaElaboracion.dia}
                  onChange={(e) => onFormDataChange({ fechaElaboracion: { ...formData.fechaElaboracion, dia: e.target.value } })}
                  placeholder="DD"
                />
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.fechaElaboracion.mes}
                  onChange={(e) => onFormDataChange({ fechaElaboracion: { ...formData.fechaElaboracion, mes: e.target.value } })}
                  placeholder="MM"
                />
                <Input
                  type="number"
                  min="2000"
                  max="2100"
                  value={formData.fechaElaboracion.anio}
                  onChange={(e) => onFormDataChange({ fechaElaboracion: { ...formData.fechaElaboracion, anio: e.target.value } })}
                  placeholder="AAAA"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-primary">Fecha de entrega</label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.fechaEntrega.dia}
                  onChange={(e) => onFormDataChange({ fechaEntrega: { ...formData.fechaEntrega, dia: e.target.value } })}
                  placeholder="DD"
                />
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={formData.fechaEntrega.mes}
                  onChange={(e) => onFormDataChange({ fechaEntrega: { ...formData.fechaEntrega, mes: e.target.value } })}
                  placeholder="MM"
                />
                <Input
                  type="number"
                  min="2000"
                  max="2100"
                  value={formData.fechaEntrega.anio}
                  onChange={(e) => onFormDataChange({ fechaEntrega: { ...formData.fechaEntrega, anio: e.target.value } })}
                  placeholder="AAAA"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-primary">Código de trazabilidad</label>
              <Input
                value={formData.codigoTrazabilidad}
                onChange={(e) => onFormDataChange({ codigoTrazabilidad: e.target.value })}
                placeholder="Código automático"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Tipo de trabajo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-primary">Servicio principal</label>
            <select
              value={servicioTipo}
              onChange={handleServicioTipoChange}
              className="h-10 w-full rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
            >
              <option value="">Seleccionar tipo de trabajo...</option>
              {TIPOS_TRABAJO_PRINCIPAL.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
              <option value="Otro">Otro</option>
            </select>
          </div>

          {servicioTipo === 'Otro' && (
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-primary">Especificar servicio</label>
              <Input
                placeholder="Describe el servicio"
                value={formData.tiposTrabajo.find((item) => item.startsWith('OTRO:'))?.replace('OTRO:', '') || ''}
                onChange={(e) => {
                  const filtered = formData.tiposTrabajo.filter((item) => !item.startsWith('OTRO:'))
                  if (e.target.value.trim()) {
                    onFormDataChange({ tiposTrabajo: [...filtered, `OTRO: ${e.target.value}`] })
                  } else {
                    onFormDataChange({ tiposTrabajo: filtered })
                  }
                }}
              />
            </div>
          )}

          {servicioTipo && (
            <div className="grid gap-3">
              <label className="text-sm font-medium text-primary">Productos</label>
              <div className="flex items-center gap-2">
                <select
                  value={productoPendiente}
                  onChange={(e) => setProductoPendiente(e.target.value)}
                  className="h-10 flex-1 rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
                  disabled={productosDisponibles.length === 0}
                >
                  <option value="">Seleccionar producto...</option>
                  {productosDisponibles.map((p) => (
                    <option
                      key={p.id}
                      value={p.titulo || p.nombre || ''}
                      disabled={formData.productos.some((x) => x.producto === (p.titulo || p.nombre))}
                    >
                      {p.titulo || p.nombre} — {formatoPrecio(p.precio)}
                    </option>
                  ))}
                </select>
                <Button type="button" onClick={agregarProducto} disabled={!productoPendiente} className="gap-2">
                  Agregar
                </Button>
              </div>

              {formData.productos.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/50 text-left">
                        <th className="px-3 py-2 font-medium text-muted-foreground">PRODUCTO</th>
                        <th className="px-3 py-2 font-medium text-muted-foreground text-center">UNIDADES</th>
                        <th className="px-3 py-2 font-medium text-muted-foreground text-center">DIENTES</th>
                        <th className="px-3 py-2 font-medium text-muted-foreground text-right">PRECIO</th>
                        <th className="px-3 py-2 font-medium text-muted-foreground text-right">PRECIO UNIT.</th>
                        <th className="px-3 py-2 font-medium text-muted-foreground text-right">TOTAL</th>
                        <th className="px-3 py-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {formData.productos.map((linea, i) => {
                        const total = (linea.unidades || 0) * (linea.precioUnitario || 0)
                        return (
                          <tr key={linea.producto} className="transition-colors hover:bg-secondary/30">
                            <td className="px-3 py-2">{linea.producto}</td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                min={0}
                                value={linea.unidades}
                                onChange={(e) =>
                                  actualizarProducto(i, 'unidades', Math.max(0, parseInt(e.target.value || '0', 10)))
                                }
                                className="w-16 h-8 rounded-md border border-border bg-card px-2 py-1 text-center text-xs"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="text"
                                value={linea.dientes}
                                onChange={(e) => actualizarProducto(i, 'dientes', e.target.value)}
                                placeholder="ej. 11,12"
                                className="w-24 h-8 rounded-md border border-border bg-card px-2 py-1 text-center text-xs"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-xs">{formatoPrecio(linea.precio)}</td>
                            <td className="px-3 py-2 text-right font-mono text-xs">{formatoPrecio(linea.precioUnitario)}</td>
                            <td className="px-3 py-2 text-right font-mono text-xs font-semibold">{formatoPrecio(total)}</td>
                            <td className="px-3 py-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                onClick={() => eliminarProducto(i)}
                              >
                                <X className="size-4" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className="flex justify-end border-t border-border p-3">
                    <div className="rounded-lg bg-secondary/50 px-3 py-2 text-xs">
                      <span className="font-bold">TOTAL: </span>
                      <span className="font-mono font-bold text-primary">
                        {formatoPrecio(
                          formData.productos.reduce((sum, p) => sum + (p.unidades || 0) * (p.precioUnitario || 0), 0),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Piezas dentales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <DentalChart
                selectedTeeth={selectedTeeth}
                toothStatuses={toothStatuses || {}}
                onToothSelect={handleToothSelect}
                onToothStatusChange={handleToothStatusChange}
                onToothStatusClear={handleToothStatusClear}
              />
              <div className="mt-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Seleccionaste: </span>
                {selectedTeethDisplay}
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-primary">Guía de color</label>
                <select
                  value={formData.guia}
                  onChange={(e) => {
                    const g = e.target.value
                    onFormDataChange({ guia: g, color: '' })
                  }}
                  className="h-10 w-full rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
                >
                  <option value="">Seleccionar guía...</option>
                  {GUIAS_LISTA.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              {formData.guia && GUIAS_Y_TONOS[formData.guia] && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-primary">Color</label>
                  <select
                    value={formData.color}
                    onChange={(e) => onFormDataChange({ color: e.target.value })}
                    className="h-10 w-full rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="">Seleccionar tono...</option>
                    {GUIAS_Y_TONOS[formData.guia].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}
              {formData.productos.reduce((sum, p) => sum + (p.unidades || 0) * (p.precioUnitario || 0), 0) > 0 && (
                <div className="rounded-lg bg-secondary/50 border border-border p-3">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold">TOTAL ESTIMADO:</span>
                    <span className="font-mono font-bold text-primary">
                      {formatoPrecio(
                        formData.productos.reduce((sum, p) => sum + (p.unidades || 0) * (p.precioUnitario || 0), 0),
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Indicaciones del odontólogo</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            className="w-full min-h-[80px]"
            placeholder="Escriba las indicaciones especiales..."
            value={formData.indicaciones}
            onChange={(e) => onFormDataChange({ indicaciones: e.target.value })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Archivos adjuntos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-2">
            <Upload className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Adjunte imágenes o PDFs (máx. 10MB c/u)</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/gif,application/pdf"
            multiple
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" />
            Seleccionar archivos
          </Button>
          {uploadedFiles.length > 0 && (
            <div className="grid gap-2">
              {uploadedFiles.map((file, fileIndex) => (
                <div key={fileIndex} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <File className="size-4 text-muted-foreground" />
                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => removeFile(fileIndex)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Piezas enviadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ['analogo', 'ANÁLOGO'],
              ['registro', 'REGISTRO DE MORDIDA'],
              ['antagonista', 'ANTAGONISTA'],
              ['coping', 'COPING DE IMP'],
              ['cubeta', 'CUBETA'],
              ['modelo', 'MODELO DE REF.'],
              ['transfer', 'TRANSFER'],
              ['articulador', 'ARTICULADOR'],
              ['ucla', 'UCLA'],
              ['guiacolor', 'GUÍA DE COLOR'],
              ['aditamento', 'ADITAMENTO'],
            ].map(([id, value]) => (
              <div key={id} className="flex items-center gap-2">
                <Checkbox
                  id={`${stableIdPrefix}-${id}`}
                  checked={formData.piezasEnviadas.includes(value)}
                  onCheckedChange={() => handleCheckboxChange('piezasEnviadas', value)}
                >
                  <CheckboxIndicator />
                </Checkbox>
                <label htmlFor={`${stableIdPrefix}-${id}`} className="text-sm cursor-pointer">
                  {value}
                </label>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
            <div className="text-xs font-semibold text-muted-foreground">CÓD. TRAZABILIDAD</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm">#</span>
              <span className="flex-1 text-center rounded-md border border-border bg-card px-3 py-1.5 text-sm font-mono" suppressHydrationWarning>
                {formData.codigoTrazabilidad}
              </span>
            </div>
            <div className="mt-1 text-center text-[10px] text-muted-foreground">INFO EXCLUSIVA DE LABORATORIO</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

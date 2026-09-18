export type ToothStatus = 'normal' | 'ausencia' | 'implante' | 'pilar'

export interface SolicitudFormData {
  odontologo: string
  registroMedico: string
  correo: string
  telefono: string
  paciente: string
  ccPaciente: string
  direccion: string
  historiaClinica: string
  firma: string
  servicio: string
  tiposTrabajo: string[]
  materiales: string[]
  indicaciones: string
  producto: string
  dientesTrabajo: string
  fechaElaboracion: { dia: string; mes: string; anio: string }
  fechaEntrega: { dia: string; mes: string; anio: string }
  color: string
  guia: string
  codigoTrazabilidad: string
  chimenea: boolean
  prueba: boolean
  terminado: boolean
  productos: ProductoLinea[]
  piezasEnviadas: string[]
  archivosAdjuntos: UploadedFile[]
}

export interface ProductoLinea {
  producto: string
  unidades: number
  dientes: string
  precio: number
  precioUnitario: number
}

export interface SolicitudEntry {
  id: string
  formData: SolicitudFormData
  servicioTipo: string
  selectedTeeth: number[]
  toothStatuses: Record<number, ToothStatus>
  uploadedFiles: UploadedFile[]
  archivoAdjunto: UploadedFile | null
}

export interface UploadedFile {
  name: string
  url: string
  size: number
}

export function createDefaultSolicitud(overrides?: Partial<SolicitudEntry>): SolicitudEntry {
  return {
    id: '',
    servicioTipo: '',
    selectedTeeth: [],
    toothStatuses: {},
    uploadedFiles: [],
    archivoAdjunto: null,
    formData: {
      odontologo: '',
      registroMedico: '',
      correo: '',
      telefono: '',
      paciente: '',
      ccPaciente: '',
      direccion: '',
      historiaClinica: '',
      firma: '',
      servicio: '',
      tiposTrabajo: [],
      materiales: [],
      indicaciones: '',
      producto: '',
      dientesTrabajo: '',
      fechaElaboracion: { dia: '', mes: '', anio: '' },
      fechaEntrega: { dia: '', mes: '', anio: '' },
      color: '',
      guia: '',
      codigoTrazabilidad: '',
      chimenea: false,
      prueba: false,
      terminado: false,
      productos: [],
      piezasEnviadas: [],
      archivosAdjuntos: [],
    },
    ...overrides,
  }
}

export function generateCodigoTrazabilidad(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = now.getFullYear()
  const month = pad(now.getMonth() + 1)
  const day = pad(now.getDate())
  const hours = pad(now.getHours())
  const minutes = pad(now.getMinutes())
  const seconds = pad(now.getSeconds())
  return `DC-${year}${month}${day}${hours}${minutes}${seconds}`
}

export function formatFecha(fecha: { dia: string; mes: string; anio: string }): string {
  const dd = fecha.dia.padStart(2, '0')
  const mm = fecha.mes.padStart(2, '0')
  return `${dd}/${mm}/${fecha.anio}`
}

export interface SolicitudFormData {
  odontologo: string
  registroMedico: string
  paciente: string
  ccPaciente: string
  direccion: string
  firma: string
  color: string
  guia: string
  codigoTrazabilidad: string
  fechaElaboracion: { dia: string; mes: string; anio: string }
  fechaEntrega: { dia: string; mes: string; anio: string }
  historiaClinica: string
  tiposTrabajo: string[]
  materiales: string[]
  productos: ProductoLinea[]
  piezasEnviadas: string[]
  chimenea: boolean
  prueba: boolean
  terminado: boolean
  indicaciones: string
}

export interface ProductoLinea {
  producto: string
  unidades: number
  dientes: string
  precio: number
  precioUnitario: number
}

export interface UploadedFile {
  name: string
  url: string
  size: number
}

export interface SolicitudEntry {
  id: string
  servicioTipo: string
  formData: SolicitudFormData
  selectedTeeth: number[]
  toothStatuses: Record<number, string>
  uploadedFiles: UploadedFile[]
}

export type ToothStatus = 'normal' | 'ausente' | 'implante' | 'corona' | 'endodoncia'

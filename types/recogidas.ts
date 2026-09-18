export interface RecogidaEnvio {
  id: string
  codigo: string
  estado: string
  servicioTransporte: string
  cliente: string
  clienteCodigo: string
  proveedor: string
  fechaEnvio: string
  fechaEntrega: string
  tipo: 'recogida' | 'envio'
  trabajoCodigo?: string
}

export type RecogidaTab = 'recogidas' | 'envios' | 'todas'

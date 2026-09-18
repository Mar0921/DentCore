export interface Mensaje {
  id: string
  contenido: string
  fechaEnvio: string
  clienteCodigo: string
  cliente: string
  trabajoCodigo: string
  estadoTrabajo: string
  leido: boolean
  pendienteConfirmacion: boolean
  tipo: 'mensaje' | 'imagen' | 'cad_cam' | 'material' | 'solicitud'
}

export type FiltroMensajes = 'bandeja_entrada' | 'bandeja_salida' | 'imagenes' | 'anexos_cad_cam' | 'materiales_cliente'

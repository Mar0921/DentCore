export interface Trabajo {
  id: string
  codigo: string
  estado: 'en_laboratorio' | 'en_proceso' | 'listo' | 'entregado' | 'retrasado'
  caja: string
  cliente: string
  clienteCodigo: string
  doctor: string
  paciente: string
  faseActual: string
  fechaEntrega: string
  horaEntrega: string
}

export type TrabajoTab = 'en_curso' | 'deben_salir_hoy' | 'retrasados' | 'estado_ejecucion'

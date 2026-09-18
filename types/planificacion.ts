export interface TareaPlanificacion {
  id: string
  trabajoId: string
  trabajoCodigo: string
  caja: string
  clienteCodigo: string
  cliente: string
  paciente: string
  fase: string
  numeroPiezas: number
  responsable: string
  fechaTopePlanificada: string
  proximaFechaPlanificada: string
  colorFase: string
}

export interface DiaSemana {
  dia: string
  fecha: string
  fechaObj: Date
}

export type ModoPlanificacion = 'dia' | 'semana' | 'calendario' | 'planificar' | 'pruebas'
export type VistaPlanificacion = 'lista' | 'cuadricula'

export interface RepeticionMensual {
  mes: string
  repetidos: number
}

export interface PruebaMensual {
  mes: string
  aprobadas: number
  rechazadas: number
}

export interface IncidenciaTipo {
  tipo: string
  cantidad: number
}

export interface RetrasoMensual {
  mes: string
  retrasoMedio: number
}

export interface AnalisisCalidadData {
  repeticionesMensuales: RepeticionMensual[]
  trabajosRepetidos: number
  variacionRepeticiones: number
  pruebasMensuales: PruebaMensual[]
  pruebasRechazadas: number
  variacionPruebas: number
  porcentajePruebasRechazadas: number
  incidencias: IncidenciaTipo[]
  incidenciasNuevas: number
  incidenciasAbiertas: number
  retrasosMensuales: RetrasoMensual[]
  tareasRetrasadas: number
  variacionRetrasos: number
  porcentajeRetrasos: number
}

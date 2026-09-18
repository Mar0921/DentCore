export interface EntradaTrabajoMensual {
  mes: string
  pendientes: number
  entregados: number
  otros: number
}

export interface ClienteTrabajo {
  codigo: string
  nombre: string
  trabajosAnio: number
  diferencia: number
}

export interface ProductoTrabajo {
  nombre: string
  unidadesAnio: number
  diferencia: number
}

export interface AnalisisTrabajosData {
  entradasMensuales: EntradaTrabajoMensual[]
  trimestres: { trabajos: number; variacion: number }[]
  trabajosEsteMes: number
  variacionEsteMes: number
  trabajosEsteAnio: number
  variacionEsteAnio: number
  clientes: ClienteTrabajo[]
  productos: ProductoTrabajo[]
}

export interface TareaMensual {
  mes: string
  tareas: number
  piezas: number
}

export interface EmpleadoProductividad {
  nombre: string
  tareas: number
}

export interface MaquinaProductividad {
  nombre: string
  tareas: number
}

export interface ExternalizacionProductividad {
  nombre: string
  tareas: number
}

export interface AnalisisProductividadData {
  tareasMensuales: TareaMensual[]
  tareasAnio: number
  variacionTareas: number
  piezasAnio: number
  variacionPiezas: number
  empleados: EmpleadoProductividad[]
  maquinas: MaquinaProductividad[]
  externalizaciones: ExternalizacionProductividad[]
}

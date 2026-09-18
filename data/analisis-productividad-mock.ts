import type { AnalisisProductividadData } from '@/types/analisis-productividad'

export const analisisProductividad: AnalisisProductividadData = {
  tareasMensuales: [
    { mes: 'Junio', tareas: 620, piezas: 1650 },
    { mes: 'Julio', tareas: 710, piezas: 1820 },
    { mes: 'Agosto', tareas: 580, piezas: 1510 },
  ],
  tareasAnio: 7818,
  variacionTareas: 10,
  piezasAnio: 20881,
  variacionPiezas: 3,
  empleados: [
    { nombre: 'Cristian David Peralta Jovel', tareas: 2276 },
    { nombre: 'Andrea Jimenez', tareas: 1337 },
    { nombre: 'Jazmín Andrea Valencia', tareas: 978 },
    { nombre: 'Jhon Wilfert Sapuyes Dorado', tareas: 913 },
    { nombre: 'VALENTINA RIOS', tareas: 901 },
    { nombre: 'Otros', tareas: 1405 },
  ],
  maquinas: [
    { nombre: 'Otros', tareas: 7 },
  ],
  externalizaciones: [
    { nombre: 'Otros', tareas: 1 },
  ],
}

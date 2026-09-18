import type { TareaPlanificacion, DiaSemana } from '@/types/planificacion'

function generarDiasSemana(desde: Date): DiaSemana[] {
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const diaLunes = new Date(desde)
  diaLunes.setDate(diaLunes.getDate() - ((diaLunes.getDay() + 6) % 7))

  return Array.from({ length: 7 }).map((_, i) => {
    const fecha = new Date(diaLunes)
    fecha.setDate(fecha.getDate() + i)
    return {
      dia: dias[fecha.getDay()],
      fecha: fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      fechaObj: fecha,
    }
  })
}

export function obtenerDiasSemanaActual(): DiaSemana[] {
  const hoy = new Date()
  return generarDiasSemana(hoy)
}

export const tareasPlanificacion: TareaPlanificacion[] = [
  {
    id: 'tarea-001',
    trabajoId: 'trab-004',
    trabajoCodigo: '20260803130344',
    caja: 'SCAN',
    clienteCodigo: '049',
    cliente: 'Carlos Viveros',
    paciente: 'FABIANA ROJAS',
    fase: 'ESCANEO Y DISEÑO',
    numeroPiezas: 1,
    responsable: 'Andrea Jimenez',
    fechaTopePlanificada: '-',
    proximaFechaPlanificada: '08/08/2026 01:00',
    colorFase: 'bg-primary/10 text-primary',
  },
  {
    id: 'tarea-002',
    trabajoId: 'trab-004',
    trabajoCodigo: '20260803130344',
    caja: 'SCAN',
    clienteCodigo: '049',
    cliente: 'Carlos Viveros',
    paciente: 'FABIANA ROJAS',
    fase: 'DISEÑO DE MODELO 3D',
    numeroPiezas: 1,
    responsable: 'Andrea Jimenez',
    fechaTopePlanificada: '-',
    proximaFechaPlanificada: '-',
    colorFase: 'bg-primary/10 text-primary',
  },
  {
    id: 'tarea-003',
    trabajoId: 'trab-004',
    trabajoCodigo: '20260803130344',
    caja: 'SCAN',
    clienteCodigo: '049',
    cliente: 'Carlos Viveros',
    paciente: 'FABIANA ROJAS',
    fase: 'FRESADO CERA',
    numeroPiezas: 1,
    responsable: 'No asignado',
    fechaTopePlanificada: '-',
    proximaFechaPlanificada: '-',
    colorFase: 'bg-primary/10 text-primary',
  },
  {
    id: 'tarea-004',
    trabajoId: 'trab-004',
    trabajoCodigo: '20260803130344',
    caja: 'SCAN',
    clienteCodigo: '049',
    cliente: 'Carlos Viveros',
    paciente: 'FABIANA ROJAS',
    fase: 'REVESTIR + DESENCERAR + INYECTAR',
    numeroPiezas: 1,
    responsable: 'Valentina Rios',
    fechaTopePlanificada: '-',
    proximaFechaPlanificada: '-',
    colorFase: 'bg-primary/10 text-primary',
  },
  {
    id: 'tarea-005',
    trabajoId: 'trab-004',
    trabajoCodigo: '20260803130344',
    caja: 'SCAN',
    clienteCodigo: '049',
    cliente: 'Carlos Viveros',
    paciente: 'FABIANA ROJAS',
    fase: 'LIBERADO Y PULIDO LIBRE DE METAL',
    numeroPiezas: 1,
    responsable: 'Valentina Rios',
    fechaTopePlanificada: '-',
    proximaFechaPlanificada: '-',
    colorFase: 'bg-accent/15 text-accent',
  },
  {
    id: 'tarea-006',
    trabajoId: 'trab-004',
    trabajoCodigo: '20260803130344',
    caja: 'SCAN',
    clienteCodigo: '049',
    cliente: 'Carlos Viveros',
    paciente: 'FABIANA ROJAS',
    fase: 'MAQUILLAJE Y CERÁMICA',
    numeroPiezas: 1,
    responsable: 'Valentina Rios',
    fechaTopePlanificada: '-',
    proximaFechaPlanificada: '-',
    colorFase: 'bg-accent/15 text-accent',
  },
  {
    id: 'tarea-007',
    trabajoId: 'trab-004',
    trabajoCodigo: '20260803130344',
    caja: 'SCAN',
    clienteCodigo: '049',
    cliente: 'Carlos Viveros',
    paciente: 'FABIANA ROJAS',
    fase: 'CONTROL DE CALIDAD LIBERACION',
    numeroPiezas: 1,
    responsable: 'No asignado',
    fechaTopePlanificada: '-',
    proximaFechaPlanificada: '-',
    colorFase: 'bg-secondary text-secondary-foreground',
  },
  {
    id: 'tarea-008',
    trabajoId: 'trab-004',
    trabajoCodigo: '20260803130344',
    caja: 'SCAN',
    clienteCodigo: '049',
    cliente: 'Carlos Viveros',
    paciente: 'FABIANA ROJAS',
    fase: 'LIMPIEZA Y DESINFECCIÓN DE DISPOSITIVO TERMINADO',
    numeroPiezas: 1,
    responsable: 'No asignado',
    fechaTopePlanificada: '-',
    proximaFechaPlanificada: 'FIN DE TRABAJO',
    colorFase: 'bg-secondary text-secondary-foreground',
  },
]

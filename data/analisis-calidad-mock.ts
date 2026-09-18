import type { AnalisisCalidadData } from '@/types/analisis-calidad'

export const analisisCalidad: AnalisisCalidadData = {
  repeticionesMensuales: [
    { mes: 'Junio', repetidos: 0 },
    { mes: 'Julio', repetidos: 0 },
    { mes: 'Agosto', repetidos: 0 },
  ],
  trabajosRepetidos: 0,
  variacionRepeticiones: 0,
  pruebasMensuales: [
    { mes: 'Junio', aprobadas: 20, rechazadas: 2 },
    { mes: 'Julio', aprobadas: 25, rechazadas: 1 },
    { mes: 'Agosto', aprobadas: 18, rechazadas: 1 },
  ],
  pruebasRechazadas: 1,
  variacionPruebas: -67,
  porcentajePruebasRechazadas: 13,
  incidencias: [
    { tipo: 'DEFECTO EN EL ESCANEO', cantidad: 5 },
    { tipo: 'MODELO FRACTURADO', cantidad: 1 },
    { tipo: 'EN IMPRESIONES Y MODELOS', cantidad: 1 },
    { tipo: 'ESPACIO OCLUSAL', cantidad: 1 },
    { tipo: 'DISEÑO DEL DISPOSITIVO', cantidad: 1 },
    { tipo: 'Otros', cantidad: 1 },
  ],
  incidenciasNuevas: 10,
  incidenciasAbiertas: 0,
  retrasosMensuales: [
    { mes: 'Junio', retrasoMedio: 1 },
    { mes: 'Julio', retrasoMedio: 2 },
    { mes: 'Agosto', retrasoMedio: 3 },
  ],
  tareasRetrasadas: 1105,
  variacionRetrasos: -50,
  porcentajeRetrasos: 14,
}

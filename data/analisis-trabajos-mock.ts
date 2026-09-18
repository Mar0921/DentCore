import type { AnalisisTrabajosData } from '@/types/analisis-trabajos'

export const analisisTrabajos: AnalisisTrabajosData = {
  entradasMensuales: [
    { mes: 'Junio', pendientes: 120, entregados: 45, otros: 30 },
    { mes: 'Julio', pendientes: 140, entregados: 60, otros: 35 },
    { mes: 'Agosto', pendientes: 90, entregados: 30, otros: 20 },
  ],
  trimestres: [
    { trabajos: 377, variacion: -2 },
    { trabajos: 391, variacion: 4 },
    { trabajos: 173, variacion: -56 },
    { trabajos: 0, variacion: -100 },
  ],
  trabajosEsteMes: 29,
  variacionEsteMes: -77,
  trabajosEsteAnio: 941,
  variacionEsteAnio: 6,
  clientes: [
    { codigo: '059', nombre: 'Herney Garzón', trabajosAnio: 98, diferencia: 72 },
    { codigo: '070', nombre: 'Luminous Dental Aesthetics', trabajosAnio: 68, diferencia: -1 },
    { codigo: '051', nombre: 'Ana Claros', trabajosAnio: 63, diferencia: 29 },
    { codigo: '001', nombre: 'Mauricio Gallego', trabajosAnio: 52, diferencia: -21 },
    { codigo: '161', nombre: 'LUIS FERNANDO REY', trabajosAnio: 47, diferencia: 24 },
    { codigo: 'otros', nombre: 'Otros', trabajosAnio: 613, diferencia: 1 },
  ],
  productos: [
    { nombre: 'LME005 - Carilla Disilicato ANLG', unidadesAnio: 316, diferencia: -24 },
    { nombre: 'ACR004 - Provisional Puente PMMA INT', unidadesAnio: 270, diferencia: 26 },
    { nombre: 'LME017 - Corona Zirconio Maquillada', unidadesAnio: 251, diferencia: -12 },
    { nombre: 'ENC001 - Encerado DX', unidadesAnio: 202, diferencia: -25 },
    { nombre: 'IMP007 - Corona Atornillada Zirconio', unidadesAnio: 193, diferencia: 9 },
    { nombre: 'Otros', unidadesAnio: 1402, diferencia: -4 },
  ],
}

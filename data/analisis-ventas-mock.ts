import type { AnalisisVentasData } from '@/types/analisis-ventas'

export const analisisVentas: AnalisisVentasData = {
  facturacionMensual: [
    { mes: 'Junio', pendiente: 0, cobrado: 0 },
    { mes: 'Julio', pendiente: 0, cobrado: 0 },
    { mes: 'Agosto', pendiente: 0, cobrado: 0 },
  ],
  albaranesMensual: [
    { mes: 'Junio', facturados: 0, almacenados: 0, enviados: 0 },
    { mes: 'Julio', facturados: 0, almacenados: 0, enviados: 0 },
    { mes: 'Agosto', facturados: 0, almacenados: 0, enviados: 0 },
  ],
  indicadoresTrabajo: [
    { label: 'En curso', valor: 7601831, trabajos: 67 },
    { label: 'En clínica', valor: 0, trabajos: 0 },
    { label: 'Finalizados', valor: 3901000, trabajos: 4 },
    { label: 'Enviados', valor: 3948854525, trabajos: 4709 },
  ],
  albaranesEsteMes: 85001,
  albaranesEsteAnio: 523217533,
  variacionEsteMes: -100,
  variacionEsteAnio: -23,
  totalAnual: 0,
  trimestres: [0, 0, 0, 0],
  productos: [
    { nombre: 'LME005 - Carilla Disilicato ANLG', ventasAnio: 70210000, diferencia: -42 },
    { nombre: 'MET007 - Híbrida Metal-Acrílico ANLG', ventasAnio: 67200000, diferencia: -37 },
    { nombre: 'IMP007 - Corona Atornillada Zirconio', ventasAnio: 57050010, diferencia: 1 },
    { nombre: 'LME017 - Corona Zirconio Maquillada', ventasAnio: 57015000, diferencia: -34 },
    { nombre: 'LME006 - Carilla Disilicato INT', ventasAnio: 36285000, diferencia: -56 },
    { nombre: 'Otros', ventasAnio: 184051324, diferencia: -14 },
  ],
}

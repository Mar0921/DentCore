import type { AnalisisComprasData } from '@/types/analisis-compras'

export const analisisCompras: AnalisisComprasData = {
  gastosMensuales: [
    { mes: 'Junio', pendiente: 0, pagado: 0 },
    { mes: 'Julio', pendiente: 0, pagado: 0 },
    { mes: 'Agosto', pendiente: 0, pagado: 0 },
  ],
  gastosTrimestrales: [
    { trimestre: '1.º trimestre', total: 0 },
    { trimestre: '2.º trimestre', total: 0 },
    { trimestre: '3.º trimestre', total: 0 },
    { trimestre: '4.º trimestre', total: 0 },
  ],
  totalAnual: 0,
  pedidosMensuales: [
    { mes: 'Junio', facturados: 0, recibidos: 0, enProceso: 0 },
    { mes: 'Julio', facturados: 0, recibidos: 0, enProceso: 0 },
    { mes: 'Agosto', facturados: 0, recibidos: 0, enProceso: 0 },
  ],
  pedidosEstados: [
    { estado: 'Nuevos', importe: 0, cantidad: 0 },
    { estado: 'En proceso', importe: 0, cantidad: 0 },
    { estado: 'Recibidos', importe: 0, cantidad: 0 },
    { estado: 'Facturados', importe: 0, cantidad: 0 },
  ],
  pedidosEsteMes: 0,
  pedidosEsteAnio: 0,
  proveedores: [],
  materiales: [],
}

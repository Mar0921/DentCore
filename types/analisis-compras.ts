export interface GastoMensual {
  mes: string
  pendiente: number
  pagado: number
}

export interface GastoTrimestre {
  trimestre: string
  total: number
}

export interface PedidoMensual {
  mes: string
  facturados: number
  recibidos: number
  enProceso: number
}

export interface PedidoEstado {
  estado: string
  importe: number
  cantidad: number
}

export interface ProveedorGasto {
  proveedor: string
  total: number
}

export interface MaterialCompra {
  material: string
  total: number
}

export interface AnalisisComprasData {
  gastosMensuales: GastoMensual[]
  gastosTrimestrales: GastoTrimestre[]
  totalAnual: number
  pedidosMensuales: PedidoMensual[]
  pedidosEstados: PedidoEstado[]
  pedidosEsteMes: number
  pedidosEsteAnio: number
  proveedores: ProveedorGasto[]
  materiales: MaterialCompra[]
}

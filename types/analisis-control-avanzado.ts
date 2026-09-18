export interface TrimestreData {
  trimestre: string
  ventasSinImpuestos: number
  comprasSinImpuestos: number
  gastosIva: number
}

export interface ProductoRendimiento {
  producto: string
  ventas: number
  coste: number
  margen: number
}

export interface ClienteEstado {
  estado: string
  cantidad: number
}

export interface CostoProduccion {
  concepto: string
  total: number
}

export interface AnalisisControlAvanzadoData {
  trimestres: TrimestreData[]
  totalAnual: {
    ventasSinImpuestos: number
    comprasSinImpuestos: number
    gastosIva: number
  }
  productos: ProductoRendimiento[]
  clientes: ClienteEstado[]
  costosProduccion: CostoProduccion[]
}

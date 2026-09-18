export interface FacturacionMensual {
  mes: string
  pendiente: number
  cobrado: number
}

export interface AlbaranMensual {
  mes: string
  facturados: number
  almacenados: number
  enviados: number
}

export interface IndicadorTrabajo {
  label: string
  valor: number
  trabajos: number
}

export interface ProductoVenta {
  nombre: string
  ventasAnio: number
  diferencia: number
}

export interface AnalisisVentasData {
  facturacionMensual: FacturacionMensual[]
  albaranesMensual: AlbaranMensual[]
  indicadoresTrabajo: IndicadorTrabajo[]
  albaranesEsteMes: number
  albaranesEsteAnio: number
  variacionEsteMes: number
  variacionEsteAnio: number
  totalAnual: number
  trimestres: number[]
  productos: ProductoVenta[]
}

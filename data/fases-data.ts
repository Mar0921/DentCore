export interface FaseDef {
  orden: number
  nombre: string
  color?: string
  descripcion?: string
}

export const FASES_PROCESO: FaseDef[] = [
  { orden: 1, nombre: 'LIMPIEZA Y DESINFECCION DE ENTRADA' },
  { orden: 2, nombre: 'VACEADO Y PREPARACION MODELOS' },
  { orden: 3, nombre: 'PLATO BASE Y RODETE' },
  { orden: 4, nombre: 'ESCANEO Y DISEÑO' },
  { orden: 5, nombre: 'DISEÑO DE MODELO 3D' },
  { orden: 6, nombre: 'LIBERADO Y PULIDO DE META EXTERNALIZADO' },
  { orden: 7, nombre: 'CONTROL DE CALIDAD DE PROCESO 1' },
  { orden: 8, nombre: 'IMPRESION RESINA' },
  { orden: 9, nombre: 'FRESADO ZR-DSL-PMMA' },
  { orden: 10, nombre: 'FRESADO CERA' },
  { orden: 11, nombre: 'ENCERADO MANUAL' },
  { orden: 12, nombre: 'SINTERIZADO' },
  { orden: 13, nombre: 'IMPRESION 3D' },
  { orden: 14, nombre: 'DISEÑO DE BARRA' },
  { orden: 15, nombre: 'ENFILADO' },
  { orden: 16, nombre: 'CONTROL CALIDAD DE PROCESO 2' },
  { orden: 17, nombre: 'PULIDO DE METAL Y RESINAS' },
  { orden: 18, nombre: 'MICROFRESADO' },
  { orden: 19, nombre: 'FRESADO MONTURA' },
  { orden: 20, nombre: 'REVESTIR + DESENCERAR + INYECTAR' },
  { orden: 21, nombre: 'LIBERADO Y PULIDO LIBRE DE METAL' },
  { orden: 22, nombre: 'MAQUILLAJE Y CERAMICA' },
  { orden: 23, nombre: 'CONTROL DE CALIDAD LIBERACION' },
  { orden: 24, nombre: 'LIMPIEZA Y DESINFECCION DE DISPOSITIVO TERMINADO' },
]

export interface TareaUsuario {
  id: string
  trabajoCodigo: string
  caja: string
  clienteCodigo: string
  cliente: string
  paciente: string
  fase: string
  numeroPiezas: number
  fechaTope: string
  fechaProxima: string
  estado: 'actual' | 'proxima' | 'adelante' | 'externalizada'
}

export interface Usuario {
  id: string
  nombre: string
  email: string
}

export type FiltroMisTrabajos = 'actuales' | 'externalizadas' | 'proximas' | 'adelante' | 'por_dia' | 'todas'

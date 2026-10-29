export interface Incidencia {
  id: string
  codigo: string
  solicitud_id: string
  solicitud_codigo_trazabilidad?: string | null
  tipo: string
  fecha: string
  hora: string
  fase: string | null
  descripcion: string
  responsable?: string | null
  estado: 'abierta' | 'en_proceso' | 'cerrada'
  fechaCreacion: string
  updated_at?: string | null
}

export type IncidenciaInsert = Omit<Incidencia, 'id' | 'fechaCreacion' | 'updated_at'>

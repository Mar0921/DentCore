export interface Cliente {
  id: string
  codigo: string
  nombre: string
  calle: string
  localidad: string
  telefono: string
  celular: string
  tieneAcceso: boolean
}

export interface Doctor {
  id: string
  nombre: string
  registroMedico: string
  clienteId: string
  clienteNombre: string
  telefono: string
  email: string
  especialidad: string
}

export interface Producto {
  id: string
  nombre: string
  categoria: string
  precio: number
  activo: boolean
}

export interface Tarifa {
  id: string
  productoId: string
  productoNombre: string
  clienteId: string
  clienteNombre: string
  precio: number
}

export interface Empleado {
  id: string
  nombre: string
  email: string
  rol: string
  departamento: string
  telefono: string
  activo: boolean
}

export interface Maquina {
  id: string
  nombre: string
  tipo: string
  estado: 'disponible' | 'en_uso' | 'mantenimiento'
  ubicacion: string
}

export interface Departamento {
  id: string
  nombre: string
  descripcion: string
  empleadosCount: number
}

export interface Fase {
  id: string
  nombre: string
  orden: number
  color: string
  descripcion: string
  empleado_id?: string | null
  empleado_nombre?: string | null
}

export interface Transporte {
  id: string
  nombre: string
  tipo: string
  telefono: string
  activo: boolean
}

export interface Etiqueta {
  id: string
  nombre: string
  descripcion: string
  campos: string[]
}

export interface Incidencia {
  id: string
  trabajoCodigo: string
  descripcion: string
  responsable: string
  estado: 'abierta' | 'en_proceso' | 'cerrada'
  fechaCreacion: string
}

export interface Implante {
  id: string
  marca: string
  sistema: string
  referencia: string
  componentes: string[]
}

export interface CRM {
  id: string
  clienteId: string
  clienteNombre: string
  tipo: string
  descripcion: string
  fecha: string
  usuario: string
}

export interface ArchivoLaboratorio {
  id: string
  nombre: string
  tipo: string
  tamano: string
  fechaSubida: string
  subidoPor: string
}

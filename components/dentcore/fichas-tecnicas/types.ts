export interface CampoEditable {
  label: string
  value: string
}

export interface Seccion {
  titulo: string
  campos: CampoEditable[]
}

export const CAMPOS_EDITABLES = [
  "Nombre del paciente",
  "Prescriptor",
  "Número de Serie o identificación del dispositivo",
  "Materiales Empleados",
  "Especificaciones de diseño",
]

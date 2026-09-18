import type { Mensaje } from '@/types/mensajes'

export const mensajes: Mensaje[] = []

export const filtrosMensajes = {
  clientes: [],
  doctores: [],
  estadosTrabajo: ['Nuevo', 'En proceso', 'En laboratorio', 'Terminado', 'Entregado'],
}

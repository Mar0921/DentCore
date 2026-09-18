import type { TareaUsuario, Usuario } from '@/types/mis-trabajos'

export const usuarios: Usuario[] = [
  { id: 'usr-001', nombre: 'Mariana', email: 'mariana@dentcore.com' },
  { id: 'usr-002', nombre: 'Andrea', email: 'andrea@dentcore.com' },
  { id: 'usr-003', nombre: 'Valentina', email: 'valentina@dentcore.com' },
  { id: 'usr-004', nombre: 'Carlos', email: 'carlos@dentcore.com' },
]

export const tareasMisTrabajos: TareaUsuario[] = []

export const contadoresMisTrabajos = {
  actuales: 0,
  proximas: 0,
  vencidas: 0,
  externalizadas: 0,
}

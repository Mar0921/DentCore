import { AppShell } from '@/components/dentcore/app-shell'
import { TrabajosTable } from '@/components/dentcore/trabajos/trabajos-table'

export default function EmpleadoTrabajosPage() {
  return (
    <AppShell sidebar="empleado">
      <TrabajosTable empleado={true} />
    </AppShell>
  )
}

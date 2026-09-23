import { AppShell } from '@/components/dentcore/app-shell'
import CalendarioSolicitudesClient from '@/components/dentcore/solicitud/calendario-solicitudes-client'

export default function EmpleadoCalendarioPage() {
  return (
    <AppShell sidebar="empleado">
      <CalendarioSolicitudesClient modo="empleado" />
    </AppShell>
  )
}

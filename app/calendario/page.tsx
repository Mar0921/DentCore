import { AppShell } from '@/components/dentcore/app-shell'
import CalendarioSolicitudesClient from '@/components/dentcore/solicitud/calendario-solicitudes-client'

export default function CalendarioPage() {
  return (
    <AppShell sidebar="laboratorio">
      <CalendarioSolicitudesClient modo="admin" />
    </AppShell>
  )
}

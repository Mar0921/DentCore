import { AppShell } from '@/components/dentcore/app-shell'
import { LaboratorioLayout } from '@/components/dentcore/laboratorio/layout'
import CalendarioSolicitudesClient from '@/components/dentcore/solicitud/calendario-solicitudes-client'

export default function LaboratorioCalendarioPage() {
  return (
    <LaboratorioLayout>
      <CalendarioSolicitudesClient modo="admin" />
    </LaboratorioLayout>
  )
}

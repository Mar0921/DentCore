import { AppShell } from '@/components/dentcore/app-shell'
import { InvitadoSolicitudesPageClient } from '@/components/dentcore/invitado/invitado-solicitudes-page-client'

export default function InvitadoSolicitudesPage() {
  return (
    <AppShell sidebar="invitado" showSidebar={false}>
      <InvitadoSolicitudesPageClient />
    </AppShell>
  )
}

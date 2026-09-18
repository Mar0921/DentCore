import { AppShell } from '@/components/dentcore/app-shell'
import { InvitadoEstadoCuentaPageClient } from '@/components/dentcore/invitado/invitado-estado-cuenta-page-client'

export default function InvitadoEstadoCuentaPage() {
  return (
    <AppShell sidebar="invitado" showSidebar={false}>
      <InvitadoEstadoCuentaPageClient />
    </AppShell>
  )
}

import { AppShell } from '@/components/dentcore/app-shell'
import { InvitadoProductosPageClient } from '@/components/dentcore/invitado/invitado-productos-page-client'

export default function InvitadoProductosPage() {
  return (
    <AppShell sidebar="invitado" showSidebar={false}>
      <InvitadoProductosPageClient />
    </AppShell>
  )
}

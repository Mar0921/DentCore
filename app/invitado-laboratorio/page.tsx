import { AppShell } from '@/components/dentcore/app-shell'
import { InvitadoLaboratorioPageClient } from '@/components/dentcore/invitado/invitado-laboratorio-page-client'

export default function InvitadoLaboratorioPage() {
  return (
    <AppShell sidebar="invitado" showSidebar={false}>
      <InvitadoLaboratorioPageClient />
    </AppShell>
  )
}
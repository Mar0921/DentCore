import { AppShell } from '@/components/dentcore/app-shell'
import { CartaConvenioInvitadoClient } from '@/components/dentcore/invitado/carta-convenio-invitado-client'

export default function CartaConvenioInvitadoPage() {
  return (
    <AppShell sidebar="invitado">
      <CartaConvenioInvitadoClient />
    </AppShell>
  )
}


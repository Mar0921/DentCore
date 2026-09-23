import { AppShell } from '@/components/dentcore/app-shell'
import { ClientePerfilPageClient } from '@/components/dentcore/laboratorio/cliente-perfil-page-client'

export default function EmpleadoClientePerfilPage() {
  return (
    <AppShell sidebar="empleado">
      <ClientePerfilPageClient empleado={true} />
    </AppShell>
  )
}

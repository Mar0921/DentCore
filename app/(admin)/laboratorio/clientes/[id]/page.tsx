import { AppShell } from '@/components/dentcore/app-shell'
import { ClienteDetallePageClient } from '@/components/dentcore/laboratorio/cliente-detalle-page-client'

export default function ClienteDetallePage() {
  return (
    <AppShell sidebar="laboratorio" showSidebar={false}>
      <ClienteDetallePageClient />
    </AppShell>
  )
}

import { AppShell } from '@/components/dentcore/app-shell'
import { ClientesTable } from '@/components/dentcore/laboratorio/clientes-table'

export default function AdminClientesPage() {
  return (
    <AppShell sidebar="laboratorio" showSidebar={false}>
      <ClientesTable />
    </AppShell>
  )
}

import { FasesPageClient } from '@/components/dentcore/laboratorio/fases-page-client'
import { AppShell } from '@/components/dentcore/app-shell'

export default function EmpleadoFasesPage() {
  return (
    <AppShell sidebar="empleado">
      <FasesPageClient modo="empleado" />
    </AppShell>
  )
}

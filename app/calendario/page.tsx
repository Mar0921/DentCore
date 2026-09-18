import { AppShell } from '@/components/dentcore/app-shell'
import CalendarioPageClient from '@/components/dentcore/calendario/calendario-page-client'

export default function CalendarioPage() {
  return (
    <AppShell sidebar="laboratorio">
      <CalendarioPageClient />
    </AppShell>
  )
}
import { AppShell } from '@/components/dentcore/app-shell'
import ChatLaboratorioPageClient from './chat-laboratorio-page-client'

export default function ChatLaboratorioPage() {
  return (
    <AppShell sidebar="laboratorio">
      <ChatLaboratorioPageClient />
    </AppShell>
  )
}

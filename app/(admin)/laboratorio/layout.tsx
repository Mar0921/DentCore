import { AppShell } from '@/components/dentcore/app-shell'

export default function LaboratorioRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell sidebar="laboratorio">{children}</AppShell>
}

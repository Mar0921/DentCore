import { AppShell } from '@/components/dentcore/app-shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserRound, Briefcase, FlaskConical, FileText, GitBranch } from 'lucide-react'
import Link from 'next/link'

const quickLinks = [
  { href: '/empleado/trabajos', label: 'Mis trabajos', description: 'Trabajos asignados y en curso', icon: Briefcase },
  { href: '/empleado/mi-laboratorio', label: 'Laboratorio', description: 'Información del laboratorio', icon: FlaskConical },
  { href: '/empleado/mis-solicitudes', label: 'Solicitudes', description: 'Solicitudes registradas', icon: FileText },
  { href: '/empleado/fases', label: 'Fases', description: 'Fases del proceso', icon: GitBranch },
  { href: '/empleado/mi-perfil', label: 'Mi perfil', description: 'Datos personales y acceso', icon: UserRound },
]

export default function EmpleadoDashboardPage() {
  return (
    <AppShell sidebar="empleado">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary">Panel del empleado</h1>
          <p className="text-sm text-muted-foreground">Acceso rápido a tus herramientas</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.href} className="border border-border transition-colors hover:bg-secondary/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="size-4 text-accent" />
                    {item.label}
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button render={<Link href={item.href} />} variant="outline" className="w-full">
                    Entrar
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}

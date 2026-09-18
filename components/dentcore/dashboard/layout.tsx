'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FlaskConical,
  Users,
  UserRound,
  ClipboardList,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/laboratorio', label: 'Panel general', icon: LayoutDashboard },
  { href: '/laboratorio/informacion', label: 'Información del laboratorio', icon: FlaskConical },
  { href: '/laboratorio/empleados', label: 'Empleados', icon: Users },
  { href: '/laboratorio/odontologos', label: 'Odontólogos', icon: UserRound },
  { href: '/laboratorio/solicitudes', label: 'Solicitudes', icon: ClipboardList },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <FlaskConical className="size-6 text-primary" />
          <span className="font-heading text-lg font-bold text-primary">
            DentCore
          </span>
        </div>

        <nav className="flex flex-col gap-0.5 p-3">
          {navItems.map((item) => {
            const isActive =
              item.href === '/laboratorio'
                ? pathname === '/laboratorio'
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="size-4 text-primary" />}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive"
            render={<Link href="/" />}
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <main className="pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}

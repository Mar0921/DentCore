'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  MessageCircle,
  Headphones,
  ChevronDown,
  FlaskConical,
  LogOut,
  Printer,
  Maximize,
  Search,
  Inbox,
  Clock,
  Globe,
  Scan,
  Calendar,
  CheckCircle2,
  MessageSquare,
  Truck,
  Trash2,
  ChevronLeft,
  Menu,
  Plus,
  Users,
  UserRound,
  Package,
  DollarSign,
  UserCog,
  Cog,
  Building2,
  GitBranch,
  TruckIcon,
  Tag,
  AlertTriangle,
  Smile,
  MessageCircleQuestion,
  FolderOpen,
  Edit,
  Trash2 as TrashIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LabHeader } from '@/components/dentcore/lab-header'

const mainNavItems = [
  { label: 'Trabajos', href: '/trabajos', active: false },
  { label: 'Mis trabajos', href: '/trabajos/mios', active: false },
  { label: 'Facturación', href: '/facturacion', active: false },
  { label: 'Almacén y gastos', href: '/almacen', active: false },
  { label: 'Laboratorio', href: '/laboratorio', active: true },
  { label: 'Análisis', href: '/analisis', active: false },
]

const laboratorioItems = [
  { label: 'Clientes', icon: Users, href: '/laboratorio/clientes', active: true },
  { label: 'Doctores/as', icon: UserRound, href: '/laboratorio/doctores' },
  { label: 'Productos', icon: Package, href: '/laboratorio/productos' },
  { label: 'Tarifas', icon: DollarSign, href: '/laboratorio/tarifas' },
  { label: 'Empleados', icon: UserCog, href: '/laboratorio/empleados' },
  { label: 'Máquinas', icon: Cog, href: '/laboratorio/maquinas' },
  { label: 'Departamentos', icon: Building2, href: '/laboratorio/departamentos' },
  { label: 'Fases', icon: GitBranch, href: '/laboratorio/fases' },
  { label: 'Transportes', icon: TruckIcon, href: '/laboratorio/transportes' },
  { label: 'Etiquetas de trabajos', icon: Tag, href: '/laboratorio/etiquetas' },
  { label: 'Incidencias y calidad', icon: AlertTriangle, href: '/laboratorio/incidencias' },
  { label: 'Implantes', icon: Smile, href: '/laboratorio/implantes' },
  { label: 'CRM', icon: MessageCircleQuestion, href: '/laboratorio/crm' },
  { label: 'Archivos del laboratorio', icon: FolderOpen, href: '/laboratorio/archivos' },
]

interface LaboratorioLayoutProps {
  children: React.ReactNode
}

export function LaboratorioLayout({ children }: LaboratorioLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <FlaskConical className="size-6" />
              <span className="font-heading text-lg font-bold">DentCore</span>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-9">
              <Bell className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-9">
              <MessageCircle className="size-4" />
            </Button>
            <Button variant="ghost" className="gap-1.5 text-xs">
              <Headphones className="size-4" />
              Soporte
              <ChevronDown className="size-3" />
            </Button>
            <LabHeader />
            <Button variant="ghost" size="icon" className="size-9">
              <span className="text-xs font-bold">?</span>
            </Button>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex items-center gap-0.5 border-t border-border px-4">
          {mainNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                item.active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
              )}
            >
              {item.label}
            </Link>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8">
              <LogOut className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8">
              <Printer className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8">
              <Maximize className="size-4" />
            </Button>
          </div>
        </nav>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'sticky top-[112px] h-[calc(100vh-112px)] border-r border-border bg-card transition-all duration-300',
            sidebarOpen ? 'w-64' : 'w-0 overflow-hidden',
          )}
        >
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </div>

            <nav className="mt-4 flex flex-col gap-0.5">
              {laboratorioItems.map((item) => {
                const Icon = item.icon
                const isActive = item.active
                return (
                  <Link
                    key={item.label}
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
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto pt-4">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setSidebarOpen(false)}
              >
                <ChevronLeft className="size-4" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {sidebarOpen ? (
            <div className="p-4">
              {children}
            </div>
          ) : (
            <div className="p-4">
              <Button
                variant="ghost"
                size="icon"
                className="mb-4"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="size-4" />
              </Button>
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

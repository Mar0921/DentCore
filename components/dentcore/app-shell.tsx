'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
   User,
  Package,
  DollarSign,
   UserCog,
  Building2,
  GitBranch,
  Trash2 as TrashIcon,
  BarChart3,
  Key,
  Shield,
  Settings,
  CalendarDays,
  Briefcase,
  FileText,
  AlertTriangle,
  MessageCircleQuestion,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

const mainNavItems = [
  { label: 'Trabajos', href: '/trabajos', active: false },
  { label: 'Mis trabajos', href: '/trabajos/mios', active: false },
  { label: 'Facturación', href: '/facturacion', active: false },
  { label: 'Almacén y gastos', href: '/almacen', active: false },
  { label: 'Laboratorio', href: '/laboratorio', active: false },
  { label: 'Análisis', href: '/analisis', active: false },
]

const adminNavItems = [
  { label: 'Dashboard', href: '/laboratorio', active: false },
  { label: 'Clientes', href: '/laboratorio/clientes', active: false },
  { label: 'Análisis', href: '/laboratorio/analisis', active: false },
  { label: 'Productos', href: '/laboratorio/productos', active: false },
  { label: 'Empleados', href: '/laboratorio/empleados', active: false },
  { label: 'Solicitudes', href: '/laboratorio/solicitudes', active: false },
]

const invitadoNavItems = [
  { label: 'Inicio', href: '/invitado-laboratorio', active: false },
  { label: 'Solicitudes', href: '/invitado-laboratorio/solicitudes', active: false },
  { label: 'Productos', href: '/invitado-laboratorio/productos', active: false },
  { label: 'Estado de cuenta', href: '/invitado-laboratorio/estado-de-cuenta', active: false },
]

const sidebarItems = [
  { label: 'Nuevos pedidos', icon: Inbox, href: '/trabajos?tab=nuevos', activePrefix: '/trabajos' },
  { label: 'Trabajos en curso', icon: Clock, href: '/trabajos?tab=en_curso', activePrefix: '/trabajos' },
  { label: 'Externalizados', icon: Globe, href: '/trabajos?tab=externalizados', activePrefix: '/trabajos' },
  { label: 'Planificación', icon: Calendar, href: '/planificacion', activePrefix: '/planificacion' },
  { label: 'Listos/en clínica', icon: CheckCircle2, href: '/trabajos?tab=listos', activePrefix: '/trabajos' },
  { label: 'Mensajes/elementos', icon: MessageSquare, href: '/trabajos/mensajes', activePrefix: '/trabajos/mensajes' },
  { label: 'Recogidas y envíos', icon: Truck, href: '/trabajos/recogidas', activePrefix: '/trabajos/recogidas' },
  { label: 'Todos los trabajos', icon: Trash2, href: '/trabajos?tab=todos', activePrefix: '/trabajos' },
]

const empleadoItems = [
  { label: 'Mis trabajos', icon: Briefcase, href: '/empleado/trabajos', activePrefix: '/empleado/trabajos' },
  { label: 'Laboratorio', icon: FlaskConical, href: '/empleado/mi-laboratorio', activePrefix: '/empleado/mi-laboratorio' },
  { label: 'Solicitudes', icon: FileText, href: '/empleado/mis-solicitudes', activePrefix: '/empleado/mis-solicitudes' },
  { label: 'Clientes', icon: Users, href: '/empleado/clientes', activePrefix: '/empleado/clientes' },
   { label: 'Fases', icon: GitBranch, href: '/empleado/fases', activePrefix: '/empleado/fases' },
  { label: 'Calendario', icon: CalendarDays, href: '/empleado/calendario', activePrefix: '/empleado/calendario' },
  { label: 'Mi perfil', icon: UserRound, href: '/empleado/mi-perfil', activePrefix: '/empleado/mi-perfil' },
]

const laboratorioItems = [
  { label: 'Clientes', icon: Users, href: '/laboratorio/clientes', activePrefix: '/laboratorio' },
  { label: 'Tarifas', icon: DollarSign, href: '/laboratorio/tarifas', activePrefix: '/laboratorio' },
  { label: 'Departamentos', icon: Building2, href: '/laboratorio/departamentos', activePrefix: '/laboratorio' },
  { label: 'Fases', icon: GitBranch, href: '/laboratorio/fases', activePrefix: '/laboratorio' },
  { label: 'Incidencias y calidad', icon: AlertTriangle, href: '/laboratorio/incidencias', activePrefix: '/laboratorio' },
  { label: 'CRM', icon: MessageCircleQuestion, href: '/laboratorio/crm', activePrefix: '/laboratorio' },
  { label: 'Archivos del laboratorio', icon: FolderOpen, href: '/laboratorio/archivos', activePrefix: '/laboratorio' },
]

interface AppShellProps {
  children: React.ReactNode
  sidebar?: 'trabajos' | 'laboratorio' | 'invitado' | 'empleado'
  showSidebar?: boolean
}

export function AppShell({ children, sidebar = 'trabajos', showSidebar = true }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [labName, setLabName] = useState<string>("Laboratorio Dental Arte Cerámico")
  const [userEmail, setUserEmail] = useState<string>("mar0921p@gmail.com")
  const [invitadoNombre, setInvitadoNombre] = useState<string>('')
  const [invitadoEmail, setInvitadoEmail] = useState<string>('')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    loadUserInfo()
  }, [])

  async function loadUserInfo() {
    try {
      if (sidebar === 'invitado') {
        const email = typeof window !== 'undefined' ? localStorage.getItem('labUserEmail') : null
        if (email) {
          setInvitadoEmail(email)
          const { data } = await supabase.from('cliente').select('nombre').eq('email', email).maybeSingle()
          if (data) setInvitadoNombre(data.nombre || '')
        }
      } else {
        const { data: labs } = await supabase.from("laboratorio").select("id, nombre").limit(1)
        if (labs && labs.length > 0) {
          setLabName(labs[0].nombre)
          const { data: employees } = await supabase.from("empleados").select("email").eq("laboratorio_id", labs[0].id).limit(1)
          if (employees && employees.length > 0) {
            setUserEmail(employees[0].email || "")
          }
        }
      }
    } catch (err) {
      console.error("Error:", err)
    }
  }

  const items = sidebar === 'laboratorio' ? laboratorioItems : sidebar === 'empleado' ? empleadoItems : sidebarItems
  const topNav = sidebar === 'laboratorio' ? adminNavItems : sidebar === 'invitado' ? invitadoNavItems : sidebar === 'empleado' ? [] : mainNavItems
  const isAnalisisAdmin = sidebar === 'laboratorio' && pathname.startsWith('/laboratorio/analisis')
  const shouldShowSidebar = showSidebar && !isAnalisisAdmin

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
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" className="gap-1.5 text-xs">
                  <Headphones className="size-4" />
                  Soporte
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Consultas</DropdownMenuItem>
                <DropdownMenuItem>Permitir acceso</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {sidebar === 'invitado' ? (
              <Button variant="ghost" className="gap-1.5 text-xs">
                <User className="size-4" />
                <span className="font-medium">{invitadoNombre || 'Invitado'}</span>
                <span className="text-muted-foreground">({invitadoEmail || '—'})</span>
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="gap-1.5 text-xs">
                  <FlaskConical className="size-4" />
                  {labName}
                  <ChevronDown className="size-3" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" className="gap-1.5 text-xs">
                      {userEmail}
                      <ChevronDown className="size-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Key className="size-4" />
                      Cambiar contraseña
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Shield className="size-4" />
                      Opciones de seguridad
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="size-4" />
                      Mis opciones
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/calendario')}>
                      <CalendarDays className="size-4" />
                      Mi calendario
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/iniciar-sesion')}>
                      <LogOut className="size-4" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            <Button variant="ghost" size="icon" className="size-9">
              <span className="text-xs font-bold">?</span>
            </Button>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex items-center gap-0.5 border-t border-border px-4">
          {topNav.map((item) => (
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
            <Button variant="ghost" size="icon" className="size-8" onClick={() => router.push('/iniciar-sesion')}>
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
        {shouldShowSidebar && (
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
                  placeholder="Buscar trabajo por código"
                  className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-accent focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <nav className="mt-4 flex flex-col gap-0.5">
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive = item.activePrefix
                    ? pathname.startsWith(item.activePrefix)
                    : item.active
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
        )}

        {/* Main Content */}
        <main className="flex-1">
          {shouldShowSidebar ? (
            sidebarOpen ? (
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
            )
          ) : (
            <div className="p-4">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

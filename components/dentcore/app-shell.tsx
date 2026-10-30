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
  FileText,
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
  AlertTriangle,
  MessageCircleQuestion,
  FolderOpen,
  AlertCircle,
  PenTool,
  Image,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SupportForm } from '@/components/dentcore/support-form'
import { exportPageToPDF, getPageTitle } from '@/lib/pdf-export'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'

const mainNavItems = [
  { label: 'Trabajos', href: '/trabajos', active: false },
  { label: 'Mis trabajos', href: '/trabajos/mios', active: false },
  { label: 'FacturaciÃ³n', href: '/facturacion', active: false },
  { label: 'AlmacÃ©n y gastos', href: '/almacen', active: false },
  { label: 'Laboratorio', href: '/laboratorio', active: false },
  { label: 'AnÃ¡lisis', href: '/analisis', active: false },
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
  { label: 'Chat', href: '/invitado-laboratorio/chat', active: false },
  { label: 'Inicio', href: '/invitado-laboratorio', active: false },
  { label: 'Solicitudes', href: '/invitado-laboratorio/solicitudes', active: false },
  { label: 'Productos', href: '/invitado-laboratorio/productos', active: false },
  { label: 'Estado de cuenta', href: '/invitado-laboratorio/estado-de-cuenta', active: false },
  { label: 'Carta Convenio', href: '/invitado-laboratorio/carta-convenio', active: false },
]

const sidebarItems = [
  { label: 'Nuevos pedidos', icon: Inbox, href: '/trabajos?tab=nuevos', activePrefix: '/trabajos' },
  { label: 'Trabajos en curso', icon: Clock, href: '/trabajos?tab=en_curso', activePrefix: '/trabajos' },
  { label: 'Externalizados', icon: Globe, href: '/trabajos?tab=externalizados', activePrefix: '/trabajos' },
  { label: 'PlanificaciÃ³n', icon: Calendar, href: '/planificacion', activePrefix: '/planificacion' },
  { label: 'Listos/en clÃ­nica', icon: CheckCircle2, href: '/trabajos?tab=listos', activePrefix: '/trabajos' },
  { label: 'Mensajes/elementos', icon: MessageSquare, href: '/trabajos/mensajes', activePrefix: '/trabajos/mensajes' },
  { label: 'Recogidas y envÃ­os', icon: Truck, href: '/trabajos/recogidas', activePrefix: '/trabajos/recogidas' },
  { label: 'Todos los trabajos', icon: Trash2, href: '/trabajos?tab=todos', activePrefix: '/trabajos' },
]

const empleadoItems = [
  { label: 'Mis trabajos', icon: Briefcase, href: '/empleado/trabajos', activePrefix: '/empleado/trabajos' },
  { label: 'Laboratorio', icon: FlaskConical, href: '/empleado/mi-laboratorio', activePrefix: '/empleado/mi-laboratorio' },
  { label: 'Solicitudes', icon: FileText, href: '/empleado/mis-solicitudes', activePrefix: '/empleado/mis-solicitudes' },
  { label: 'Incidencias', icon: FileText, href: '/empleado/incidencias', activePrefix: '/empleado/incidencias' },
  { label: 'Clientes', icon: Users, href: '/empleado/clientes', activePrefix: '/empleado/clientes' },
   { label: 'Fases', icon: GitBranch, href: '/empleado/fases', activePrefix: '/empleado/fases' },
  { label: 'Calendario', icon: CalendarDays, href: '/empleado/calendario', activePrefix: '/empleado/calendario' },
  { label: 'Evidencias', icon: Image, href: '/empleado/evidencias', activePrefix: '/empleado/evidencias' },
  { label: 'Mi perfil', icon: UserRound, href: '/empleado/mi-perfil', activePrefix: '/empleado/mi-perfil' },
]

const laboratorioItems = [
  { label: 'Chat', icon: MessageCircle, href: '/laboratorio/chat', activePrefix: '/laboratorio/chat' },
  { label: 'Clientes', icon: Users, href: '/laboratorio/cliente', activePrefix: '/laboratorio/cliente' },
  { label: 'Tarifas', icon: DollarSign, href: '/laboratorio/tarifas', activePrefix: '/laboratorio/tarifas' },
  { label: 'Departamentos', icon: Building2, href: '/laboratorio/departamentos', activePrefix: '/laboratorio/departamentos' },
  { label: 'Fases', icon: GitBranch, href: '/laboratorio/fases', activePrefix: '/laboratorio/fases' },
  { label: 'Incidencias y calidad', icon: AlertTriangle, href: '/laboratorio/incidencias', activePrefix: '/laboratorio/incidencias' },
  { label: 'CRM', icon: MessageCircleQuestion, href: '/laboratorio/crm', activePrefix: '/laboratorio/crm' },
  { label: 'Archivos del laboratorio', icon: FolderOpen, href: '/laboratorio/archivos', activePrefix: '/laboratorio/archivos' },
  { label: 'Evidencias', icon: Image, href: '/laboratorio/evidencias', activePrefix: '/laboratorio/evidencias' },
  { label: 'Firmas', icon: PenTool, href: '/laboratorio/firmas', activePrefix: '/laboratorio/firmas' },
]

interface AppShellProps {
  children: React.ReactNode
  sidebar?: 'trabajos' | 'laboratorio' | 'invitado' | 'empleado'
  showSidebar?: boolean
}

export function AppShell({ children, sidebar = 'trabajos', showSidebar = true }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [labName, setLabName] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const [invitadoNombre, setInvitadoNombre] = useState<string>('')
  const [invitadoEmail, setInvitadoEmail] = useState<string>('')
  const [cartaPendiente, setCartaPendiente] = useState(false)
  const [urgentSolicitudes, setUrgentSolicitudes] = useState<any[]>([])
  const [supportOpen, setSupportOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('labUserEmail')
      localStorage.removeItem('labUserName')
      localStorage.removeItem('labName')
      localStorage.removeItem('labUserType')
    }
    router.push('/iniciar-sesion')
  }

  async function handleExportPDF() {
    setIsExporting(true)
    try {
      const title = getPageTitle()
      await exportPageToPDF(title)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Error al generar el PDF')
    } finally {
      setIsExporting(false)
    }
  }

  useEffect(() => {
    if (sidebar === 'invitado') {
      const email = localStorage.getItem('labUserEmail')
      if (email) {
        supabase.from('cliente').select('id').eq('email', email).maybeSingle().then(({ data: cli }) => {
          if (cli?.id) {
            supabase.from('cartas_convenio').select('firmado').eq('cliente_id', cli.id).maybeSingle().then(({ data: carta }) => {
              setCartaPendiente(!carta?.firmado)
            })
          }
        })
      }
    } else if (sidebar === 'empleado' || sidebar === 'laboratorio') {
      const now = new Date()
      const limit = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
      supabase.from('solicitudes').select('id, codigo_trazabilidad, fecha_entrega').then(({ data }) => {
        const list = (data || []).filter((s: any) => {
          if (!s.fecha_entrega) return false
          const d = new Date(s.fecha_entrega)
          return d <= limit
        })
        setUrgentSolicitudes(list)
      })
    }
  }, [sidebar])

  function loadUserInfo() {
    if (typeof window !== 'undefined') {
      if (sidebar === 'invitado') {
        const email = localStorage.getItem('labUserEmail')
        if (email) {
          setInvitadoEmail(email)
          const nombre = localStorage.getItem('labUserName')
          if (nombre) setInvitadoNombre(nombre)
        }
      } else {
        const storedLabName = localStorage.getItem('labName')
        const storedUserName = localStorage.getItem('labUserName')
        const storedUserEmail = localStorage.getItem('labUserEmail')
        setLabName(storedLabName || "")
        setUserName(storedUserName || "")
        setUserEmail(storedUserEmail || "")
      }
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
                <Button variant="ghost" className="gap-1.5 text-xs" onClick={() => setSupportOpen(true)}>
                  <Headphones className="size-4" />
                  Soporte
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSupportOpen(true)}>
                  <MessageSquare className="size-4 mr-2" />
                  Consultas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSupportOpen(true)}>
                  <AlertCircle className="size-4 mr-2" />
                  Soporte tÃ©cnico
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSupportOpen(true)}>
                  <AlertCircle className="size-4 mr-2" />
                  Reportar error
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSupportOpen(true)}>
                  <MessageSquare className="size-4 mr-2" />
                  Sugerencia
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <SupportForm open={supportOpen} onOpenChange={setSupportOpen} />
            <Button variant="ghost" size="icon" className="size-9" onClick={handleExportPDF} title="Exportar a PDF" disabled={isExporting}>
              <Printer className="size-4" />
            </Button>
            {sidebar === 'invitado' ? (
              <Button variant="ghost" className="gap-1.5 text-xs">
                <User className="size-4" />
                <span className="font-medium">{invitadoNombre || 'Invitado'}</span>
                <span className="text-muted-foreground">({invitadoEmail || 'â€”'})</span>
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="gap-1.5 text-xs">
                  <FlaskConical className="size-4" />
                  {labName || "Cargando..."}
                  <ChevronDown className="size-3" />
                </Button>
                <Button variant="ghost" className="gap-1.5 text-xs">
                  <User className="size-3" />
                  {userName || "Cargando..."}
                  <ChevronDown className="size-3" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" className="gap-1.5 text-xs">
                      {userEmail || "Cargando..."}
                      <ChevronDown className="size-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Key className="size-4" />
                      Cambiar contraseÃ±a
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
                    <DropdownMenuItem onClick={handleLogout}>
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
            <span key={item.label} className="flex items-center gap-1">
              <Link
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
               {item.label === 'Solicitudes' && sidebar !== 'invitado' && (
                 <Button
                   variant="ghost"
                   size="sm"
                   className="h-7 px-2 text-xs"
                   onClick={() => router.push('/calendario')}
                 >
                   Calendario
                 </Button>
               )}
            </span>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8" onClick={handleLogout}>
              <LogOut className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" onClick={handleExportPDF} title="Exportar a PDF" disabled={isExporting}>
              <Printer className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8">
              <Maximize className="size-4" />
            </Button>
          </div>
        </nav>
      </header>

      {sidebar === 'invitado' && cartaPendiente && (
        <div className="bg-yellow-500 text-black text-center py-2 font-semibold">
          Pendiente por firmar carta convenio
        </div>
      )}
      { (sidebar === 'empleado' || sidebar === 'laboratorio') && urgentSolicitudes.length > 0 && (
        <div className="bg-red-600 text-white text-center py-2 font-semibold flex items-center justify-center gap-2">
          Alerta: {urgentSolicitudes.length} solicitud(es) con entrega en 2 días o menos:
          {urgentSolicitudes.map((s) => (
            <a key={s.id} href={sidebar === 'laboratorio' ? `/laboratorio/solicitudes/${s.id}` : `/empleado/mis-solicitudes/${s.id}`} className="underline hover:text-yellow-200">
              {s.codigo_trazabilidad || s.id}
            </a>
          ))}
        </div>
      )}
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



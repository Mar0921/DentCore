import {
  ClipboardList,
  CalendarRange,
  Receipt,
  Package,
  MessageSquare,
  TrendingUp,
} from 'lucide-react'

const features = [
  {
    icon: ClipboardList,
    title: 'Gestión de solicitudes',
    items: ['Registro de trabajos', 'Estados de producción', 'Archivos STL', 'Fotografías', 'Historial completo'],
  },
  {
    icon: CalendarRange,
    title: 'Producción y planificación',
    items: ['Asignación de técnicos', 'Calendario', 'Prioridades', 'Fechas de entrega', 'Seguimiento en tiempo real'],
  },
  {
    icon: Receipt,
    title: 'Facturación y pagos',
    items: ['Generación de facturas', 'Historial de pagos', 'Facturas en PDF', 'Cuentas por cobrar', 'Reportes financieros'],
  },
  {
    icon: Package,
    title: 'Inventario',
    items: ['Materiales', 'Entradas y salidas', 'Control de stock', 'Trazabilidad'],
  },
  {
    icon: MessageSquare,
    title: 'Comunicación',
    items: ['Chat interno', 'Notificaciones', 'Comentarios por solicitud', 'Compartir imágenes y documentos'],
  },
  {
    icon: TrendingUp,
    title: 'Reportes',
    items: ['Producción', 'Ingresos', 'Solicitudes', 'Técnicos', 'Clientes', 'Estadísticas generales'],
  },
]

export function Features() {
  return (
    <section id="funciones" className="bg-secondary/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">
            Funciones principales
          </span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Todo lo que necesita tu laboratorio
          </h2>
          <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
            DentCore reúne en una sola plataforma todas las herramientas para
            administrar un laboratorio dental moderno. Ya no necesitas diferentes
            aplicaciones para controlar solicitudes, producción, inventario,
            facturación o comunicación.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <f.icon className="size-6" />
              </div>
              <h3 className="mt-5 font-heading text-xl font-semibold text-primary">
                {f.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {f.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

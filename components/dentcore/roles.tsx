import { Building2, Wrench, UserRound, Settings2 } from 'lucide-react'

const roles = [
  {
    icon: Building2,
    tag: 'Laboratorio',
    desc: 'Gestiona toda la operación del laboratorio.',
    items: ['Solicitudes', 'Técnicos', 'Inventario', 'Facturación', 'Reportes', 'Configuración'],
  },
  {
    icon: Wrench,
    tag: 'Técnico',
    desc: 'Accede únicamente a los trabajos asignados.',
    items: ['Cambiar estados', 'Registrar avances', 'Subir fotografías', 'Adjuntar archivos', 'Comentarios'],
  },
  {
    icon: UserRound,
    tag: 'Invitado del laboratorio',
    desc: 'Acceso limitado según los permisos otorgados.',
    items: ['Solicitudes', 'Documentos', 'Facturas autorizadas', 'Fotografías', 'Estado de producción'],
  },
  {
    icon: Settings2,
    tag: 'Equipo DentCore',
    desc: 'Administración completa de la plataforma.',
    items: ['Laboratorios registrados', 'Suscripciones', 'Soporte', 'Estadísticas generales', 'Configuración global'],
  },
]

export function Roles() {
  return (
    <section className="relative overflow-hidden bg-primary py-20 text-primary-foreground lg:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 opacity-40 bg-[radial-gradient(40%_60%_at_90%_10%,color-mix(in_oklab,var(--accent)_40%,transparent),transparent)]"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent-foreground/90">
            Tipos de acceso
          </span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Un panel adaptado a cada rol de tu equipo
          </h2>
          <p className="mt-5 text-pretty leading-relaxed text-primary-foreground/70">
            DentCore ofrece diferentes paneles según el rol de cada usuario, con
            permisos claros y una experiencia pensada para cada tarea.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((r, i) => (
            <div
              key={r.tag}
              className="relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <r.icon className="size-5" />
                </div>
                <span className="font-heading text-3xl font-bold text-white/15">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold">{r.tag}</h3>
              <p className="mt-1.5 text-sm text-primary-foreground/70">{r.desc}</p>
              <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                {r.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-primary-foreground/80"
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-accent" />
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

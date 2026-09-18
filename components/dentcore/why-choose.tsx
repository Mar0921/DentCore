import { Blocks, Zap, GraduationCap, Headphones, RefreshCw, ShieldCheck } from 'lucide-react'

const reasons = [
  { icon: Blocks, title: 'Adaptable', text: 'Funciona para laboratorios pequeños, medianos y grandes.' },
  { icon: Zap, title: 'Fácil de implementar', text: 'Empieza a trabajar en minutos, sin instalaciones complejas.' },
  { icon: GraduationCap, title: 'Capacitación', text: 'Acompañamiento durante toda la implementación.' },
  { icon: Headphones, title: 'Soporte', text: 'Asistencia rápida cuando la necesites.' },
  { icon: RefreshCw, title: 'Actualizaciones', text: 'Nuevas funciones y mejoras continuas sin costo adicional.' },
  { icon: ShieldCheck, title: 'Seguridad', text: 'Respaldo automático y almacenamiento seguro en la nube.' },
]

export function WhyChoose() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">
            Ventajas
          </span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            ¿Por qué elegir DentCore?
          </h2>
        </div>

        <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="flex gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <r.icon className="size-6" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-primary">{r.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

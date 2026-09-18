import Image from 'next/image'
import {
  Rocket,
  Cloud,
  Users,
  Wallet,
  Lock,
  BarChart3,
} from 'lucide-react'

const benefits = [
  {
    icon: Rocket,
    title: 'Mayor productividad',
    text: 'Automatiza procesos, reduce tareas repetitivas y mantén toda la información organizada.',
  },
  {
    icon: Cloud,
    title: 'Acceso desde cualquier lugar',
    text: 'Gestiona tu laboratorio desde computador, tablet o celular.',
  },
  {
    icon: Users,
    title: 'Colaboración eficiente',
    text: 'Conecta administradores, técnicos e invitados en un mismo espacio de trabajo.',
  },
  {
    icon: Wallet,
    title: 'Facturación integrada',
    text: 'Genera facturas, registra pagos y consulta el historial financiero sin usar otro software.',
  },
  {
    icon: Lock,
    title: 'Seguridad',
    text: 'Tus datos permanecen protegidos con copias de seguridad automáticas y conexiones seguras.',
  },
  {
    icon: BarChart3,
    title: 'Información en tiempo real',
    text: 'Consulta indicadores, reportes y estadísticas para tomar mejores decisiones.',
  },
]

export function Why() {
  return (
    <section id="nosotros" className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative order-last lg:order-first">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-secondary" />
            <div className="overflow-hidden rounded-2xl border border-border shadow-xl">
              <Image
                src="/dental-lab-technician.png"
                alt="Técnica de laboratorio dental revisando una prótesis en su estación de trabajo"
                width={900}
                height={900}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-accent">
              ¿Por qué DentCore?
            </span>
            <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              Modernizamos la administración de tu laboratorio
            </h2>
            <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
              DentCore es una plataforma web para modernizar la administración de
              laboratorios dentales. Desde el registro de solicitudes hasta la
              entrega y facturación de cada caso, todo se gestiona en un único
              sistema, accesible desde cualquier dispositivo y sin instalaciones.
            </p>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              Nos encargamos de la infraestructura, la seguridad y las
              actualizaciones para que tu equipo pueda concentrarse en lo realmente
              importante: ofrecer un trabajo de calidad a tus clientes.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <b.icon className="size-6" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-semibold text-primary">
                {b.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {b.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

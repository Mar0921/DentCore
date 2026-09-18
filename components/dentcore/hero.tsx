import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Play, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-background">
      {/* soft decorative background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_100%_0%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent),radial-gradient(50%_40%_at_0%_100%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent)]"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24 lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-xs font-semibold text-primary">
            <ShieldCheck className="size-4 text-accent" />
            Plataforma en la nube para laboratorios dentales
          </span>

          <h1 className="mt-6 text-balance font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-primary sm:text-5xl lg:text-6xl">
            El sistema que impulsa tu laboratorio dental.
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Centraliza la gestión de trabajos, clientes, técnicos, inventario y
            facturación en una sola plataforma. Trabaja desde cualquier lugar con
            una solución moderna, segura y diseñada para optimizar cada etapa de tu
            laboratorio.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              render={<Link href="/suscripcion" />}
              size="lg"
              className="group h-12 gap-2 rounded-full px-7 text-base"
            >
              Comenzar gratis
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button
              render={<Link href="/suscripcion?plan=enterprise" />}
              size="lg"
              variant="outline"
              className="h-12 gap-2 rounded-full border-primary/20 px-7 text-base text-primary hover:bg-secondary"
            >
              <Play className="size-4 fill-accent text-accent" />
              Solicitar demostración
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Sin instalaciones</span>
            <span className="h-4 w-px bg-border" />
            <span>Copias de seguridad automáticas</span>
            <span className="h-4 w-px bg-border" />
            <span>Acceso multiplataforma</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/5" />
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10">
            <Image
              src="/dentcore-dashboard.png"
              alt="Panel de control de DentCore mostrando trabajos, técnicos y facturación de un laboratorio dental"
              width={1200}
              height={900}
              priority
              className="h-auto w-full"
            />
          </div>

          <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-border bg-card p-4 shadow-lg sm:block">
            <p className="font-heading text-2xl font-bold text-primary">+430</p>
            <p className="text-xs text-muted-foreground">Laboratorios confían en DentCore</p>
          </div>
        </div>
      </div>
    </section>
  )
}

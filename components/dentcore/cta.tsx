import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Cta() {
  return (
    <section id="contacto" className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12 lg:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50 bg-[radial-gradient(45%_60%_at_15%_20%,color-mix(in_oklab,var(--accent)_45%,transparent),transparent),radial-gradient(45%_60%_at_85%_90%,color-mix(in_oklab,var(--accent)_30%,transparent),transparent)]"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Lleva la gestión de tu laboratorio al siguiente nivel
            </h2>
            <p className="mt-5 text-pretty leading-relaxed text-primary-foreground/75">
              Prueba DentCore y descubre cómo una plataforma moderna puede ayudarte
              a ahorrar tiempo, mejorar la organización y ofrecer un mejor servicio
              a tus clientes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                render={<Link href="/suscripcion" />}
                size="lg"
                className="group h-12 gap-2 rounded-full bg-accent px-8 text-base text-accent-foreground hover:bg-accent/90"
              >
                Comenzar gratis
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                render={<Link href="/suscripcion?plan=enterprise" />}
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/25 bg-transparent px-8 text-base text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              >
                Solicitar demostración
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

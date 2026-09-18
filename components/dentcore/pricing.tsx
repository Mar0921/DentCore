import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { plans as planData, formatPrice } from '@/lib/plans'

const plans = planData.map((p) => ({
  id: p.id,
  name: p.name,
  desc: p.desc,
  price: p.monthly !== null ? formatPrice(p.monthly) : (p.priceLabel ?? ''),
  period: p.monthly !== null ? '/mes' : '',
  features: p.features,
  cta: p.cta,
  featured: p.featured,
}))

export function Pricing() {
  return (
    <section id="planes" className="bg-secondary/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">
            Planes
          </span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Un plan para cada laboratorio
          </h2>
          <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
            Elige el plan que mejor se adapte a tu operación. Cambia de plan en
            cualquier momento sin complicaciones.
          </p>
        </div>

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative flex flex-col rounded-2xl border p-8 transition-shadow',
                plan.featured
                  ? 'border-transparent bg-primary text-primary-foreground shadow-2xl shadow-primary/20 lg:-translate-y-3'
                  : 'border-border bg-card shadow-sm hover:shadow-lg',
              )}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-semibold text-accent-foreground">
                  Más recomendado
                </span>
              )}
              <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
              <p
                className={cn(
                  'mt-1.5 text-sm',
                  plan.featured ? 'text-primary-foreground/70' : 'text-muted-foreground',
                )}
              >
                {plan.desc}
              </p>
              <div className="mt-6 flex items-end gap-1">
                <span className="font-heading text-4xl font-extrabold">{plan.price}</span>
                <span
                  className={cn(
                    'pb-1 text-sm',
                    plan.featured ? 'text-primary-foreground/70' : 'text-muted-foreground',
                  )}
                >
                  {plan.period}
                </span>
              </div>

              <ul className="mt-7 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full',
                        plan.featured ? 'bg-accent text-accent-foreground' : 'bg-secondary text-primary',
                      )}
                    >
                      <Check className="size-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                render={<Link href={`/suscripcion?plan=${plan.id}`} />}
                className={cn(
                  'group mt-8 h-11 w-full gap-2 rounded-full',
                  plan.featured
                    ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                    : '',
                )}
                variant={plan.featured ? 'default' : 'outline'}
              >
                {plan.cta}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

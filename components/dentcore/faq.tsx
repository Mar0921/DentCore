'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    q: '¿Necesito instalar algún programa?',
    a: 'No. DentCore es una plataforma 100% web. Solo necesitas un navegador y conexión a internet para acceder desde cualquier dispositivo.',
  },
  {
    q: '¿Puedo acceder desde el celular?',
    a: 'Sí. DentCore está diseñado para funcionar en computador, tablet y celular, adaptándose a cada pantalla.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Tus datos se almacenan de forma segura en la nube, con copias de seguridad automáticas y conexiones cifradas.',
  },
  {
    q: '¿Cómo funciona la prueba gratuita?',
    a: 'Puedes comenzar gratis y explorar las funciones principales sin necesidad de tarjeta de crédito. Actualiza a un plan cuando estés listo.',
  },
  {
    q: '¿Puedo cambiar de plan en cualquier momento?',
    a: 'Sí. Puedes subir o bajar de plan cuando lo necesites, y los cambios se aplican de inmediato.',
  },
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Aceptamos las principales tarjetas de crédito y débito, además de otros métodos de pago según tu región.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">
            Preguntas frecuentes
          </span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Resolvemos tus dudas
          </h2>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={item.q}
                className={cn(
                  'rounded-xl border transition-colors',
                  isOpen ? 'border-accent/40 bg-secondary/60' : 'border-border bg-card',
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-heading text-base font-semibold text-primary">
                    {item.q}
                  </span>
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
                  </span>
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-in-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
